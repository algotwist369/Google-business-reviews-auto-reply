import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { CreditCard, Check, Loader2 } from 'lucide-react';

export default function SubscriptionPanel({ token }) {
  const [plans, setPlans] = useState({});
  const [subscription, setSubscription] = useState(null);
  const [trial, setTrial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [error, setError] = useState(null);
  const scriptPromiseRef = useRef(null);

  const ensureRazorpayScript = useCallback(() => {
    if (typeof window === 'undefined') {
      return Promise.resolve(false);
    }

    if (window.Razorpay) {
      return Promise.resolve(true);
    }

    if (scriptPromiseRef.current) {
      return scriptPromiseRef.current;
    }

    scriptPromiseRef.current = new Promise((resolve) => {
      if (document.getElementById('razorpay-sdk')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

    return scriptPromiseRef.current;
  }, []);

  const loadData = useCallback(
    async (signal) => {
      if (!token || signal?.aborted) return;
      try {
        setLoading(true);
        setError(null);
        const requestConfig = signal ? { signal } : undefined;
        const [plansRes, statusRes] = await Promise.all([
          api.getSubscriptionPlans(token, requestConfig),
          api.getSubscriptionStatus(token, requestConfig)
        ]);
        if (signal?.aborted) return;
        setPlans(plansRes.data?.plans || {});
        setSubscription(statusRes.data?.subscription);
        setTrial(statusRes.data?.trial);
      } catch (err) {
        if (signal?.aborted) return;
        setError('Failed to load subscription information.');
      } finally {
        if (signal?.aborted) return;
        setLoading(false);
        setProcessingAction(false);
        setProcessingPlan(null);
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    ensureRazorpayScript();
  }, [ensureRazorpayScript]);

  const handleSubscribe = useCallback(
    async (planKey) => {
      if (!token) return;

      setError(null);

      if (planKey === 'free') {
        try {
          setProcessingPlan(planKey);
          const response = await api.createCheckoutSession(token, planKey);
        if (response.success) {
          await loadData();
          toast.success('Switched to free plan successfully!');
        } else {
          toast.error('Unable to switch to the free plan. Please try again.');
        }
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to switch plan.');
        } finally {
          setProcessingPlan(null);
        }
        return;
      }

      const scriptLoaded = await ensureRazorpayScript();
      if (!scriptLoaded) {
        setError('Unable to load Razorpay checkout. Please try again.');
        return;
      }

      try {
        setProcessingPlan(planKey);
        const response = await api.createCheckoutSession(token, planKey);
        if (!response.success || !response.data?.orderId) {
          throw new Error('Failed to create Razorpay order.');
        }

        const orderData = response.data;
        const selectedPlan = plans[planKey];

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Google Business Profile Auto Reply',
          description: `Subscription - ${selectedPlan?.name || planKey}`,
          order_id: orderData.orderId,
          prefill: {
            name: orderData.customer?.name || '',
            email: orderData.customer?.email || ''
          },
          notes: {
            plan: planKey
          },
          theme: {
            color: '#0F172A'
          },
          handler: async (paymentResponse) => {
            try {
              await api.verifyRazorpayPayment(token, paymentResponse);
              toast.success('Payment verified! Your subscription is now active.');
              await loadData();
            } catch (err) {
              toast.error(err.response?.data?.error || 'Payment verification failed. Please contact support.');
            } finally {
              setProcessingPlan(null);
            }
          },
          modal: {
            ondismiss: () => {
              setProcessingPlan(null);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          setProcessingPlan(null);
          setError(response.error?.description || 'Payment failed. Please try again.');
        });
        rzp.open();
      } catch (err) {
        setProcessingPlan(null);
        setError(err.response?.data?.error || err.message || 'Failed to start checkout process.');
      }
    },
    [ensureRazorpayScript, loadData, plans, token]
  );

  const handleCancel = useCallback(async () => {
    if (
      !window.confirm(
        'Are you sure you want to cancel your subscription? It will remain active until the end of the billing period.'
      )
    ) {
      return;
    }

    try {
      setProcessingAction(true);
      setError(null);
      await api.cancelSubscription(token);
      await loadData();
      toast.success('Subscription cancelled. You have been moved to the Free plan.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel subscription.');
    } finally {
      setProcessingAction(false);
    }
  }, [loadData, token]);

  const formatPrice = useCallback((priceInPaise, currency = 'INR') => {
    if (!priceInPaise) return 'Free';
    const amount = (priceInPaise / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const symbol = currency === 'INR' ? '₹' : '';
    return `${symbol}${amount}/month`;
  }, []);

  const trialDaysRemaining = useMemo(() => {
    if (!trial || trial.status !== 'active' || !trial.endDate) return 0;
    const diff = new Date(trial.endDate).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [trial]);

  const currentPlan = subscription?.plan || 'free';
  const currentPlanName = useMemo(() => plans[currentPlan]?.name || currentPlan, [plans, currentPlan]);
  const planEntries = useMemo(() => Object.entries(plans), [plans]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-1 sm:px-2 pb-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200  text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="p-4  border border-gray-100 bg-gray-50 ">
          <p className="text-xs uppercase font-semibold text-gray-400">Plan overview</p>
          <div className="mt-2 flex flex-wrap gap-3 items-center">
            <div>
              <p className="text-sm text-gray-500">Current plan</p>
              <p className="text-lg font-semibold text-gray-900">{currentPlanName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p
                className={`text-lg font-semibold ${
                  subscription?.status === 'active' ? 'text-green-600' : 'text-amber-600'
                }`}
              >
                {subscription?.status || 'active'}
              </p>
            </div>
            {subscription?.expiresAt && (
              <div>
                <p className="text-sm text-gray-500">
                  {subscription.status === 'active' ? 'Renews on' : 'Expires on'}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(subscription.expiresAt).toLocaleDateString()}
                </p>
              </div>
            )}
            {(subscription?.status === 'cancelled' || subscription?.status === 'expired') && (
              <div className="text-sm text-amber-600">
                Choose a plan below to reactivate your subscription.
              </div>
            )}
          </div>
          {subscription?.status === 'active' && currentPlan !== 'free' && (
            <button
              onClick={handleCancel}
              disabled={processingAction}
              className="mt-4 inline-flex items-center justify-center  border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {processingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel subscription'}
            </button>
          )}
        </div>

        {trial && trial.status === 'active' && trialDaysRemaining > 0 && (
          <div className="p-4  border border-gray-100 bg-gray-50 ">
            <p className="text-sm text-gray-900 font-semibold">Free trial active</p>
            <p className="text-xs text-gray-700 mt-1">
              {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining · Expires{' '}
              {new Date(trial.endDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {planEntries.map(([key, plan]) => {
          const isCurrentPlan = currentPlan === key;
          const isPaid = plan.priceInPaise > 0;
          const isProcessingThisPlan = processingPlan === key;

          return (
            <div
              key={key}
              className={` border ${isCurrentPlan ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-white'}  p-4 space-y-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                  <p className="text-xs text-gray-500">{isPaid ? 'Paid plan' : 'Free plan'}</p>
                </div>
                {isCurrentPlan && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">Current</span>
                )}
              </div>

              <div>
                <p className="text-3xl font-bold text-gray-900">{formatPrice(plan.priceInPaise, plan.currency)}</p>
                {isPaid && <p className="text-xs text-gray-500 mt-1">Billed monthly</p>}
              </div>

              <div className="space-y-2">
                {plan.features?.map((feature, idx) => (
                  <div key={idx} className="flex items-start text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe(key)}
                disabled={isCurrentPlan || isProcessingThisPlan || processingAction}
                className={`w-full  px-4 py-2 text-sm font-semibold transition ${
                  isCurrentPlan
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : isPaid
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessingThisPlan ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : isCurrentPlan ? (
                  'Current plan'
                ) : isPaid ? (
                  <>
                    <CreditCard className="h-4 w-4 inline mr-2" />
                    Subscribe
                  </>
                ) : (
                  'Switch to free'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}


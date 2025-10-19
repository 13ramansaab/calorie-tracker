import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature',
};

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.text();
    const event: StripeEvent = JSON.parse(body);

    console.log('Stripe webhook received:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(supabase, event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabase, event);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function handleSubscriptionUpdate(supabase: any, event: StripeEvent) {
  const subscription = event.data.object;

  const customerId = subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
  const cancelAtPeriodEnd = subscription.cancel_at_period_end || false;

  const priceId = subscription.items.data[0]?.price.id;
  const plan = mapStripePriceToPlan(priceId);

  const { data: existingSub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('provider_subscription_id', subscriptionId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching subscription:', fetchError);
    throw fetchError;
  }

  if (existingSub) {
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan,
        status: mapStripeStatus(status),
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: cancelAtPeriodEnd,
      })
      .eq('provider_subscription_id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      throw updateError;
    }

    console.log('Subscription updated:', subscriptionId);
  } else {
    const { data: customer } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('provider_customer_id', customerId)
      .maybeSingle();

    if (customer) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan,
          status: mapStripeStatus(status),
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          provider_subscription_id: subscriptionId,
          cancel_at_period_end: cancelAtPeriodEnd,
        })
        .eq('user_id', customer.user_id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        throw updateError;
      }

      console.log('Subscription created:', subscriptionId);
    }
  }
}

async function handleSubscriptionDeleted(supabase: any, event: StripeEvent) {
  const subscription = event.data.object;
  const subscriptionId = subscription.id;

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
    })
    .eq('provider_subscription_id', subscriptionId);

  if (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }

  console.log('Subscription canceled:', subscriptionId);
}

async function handlePaymentSucceeded(supabase: any, event: StripeEvent) {
  const invoice = event.data.object;

  const customerId = invoice.customer;
  const amount = invoice.amount_paid / 100;
  const currency = invoice.currency.toUpperCase();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id, id')
    .eq('provider_customer_id', customerId)
    .maybeSingle();

  if (subscription) {
    const { error } = await supabase.from('payments').insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      amount,
      currency,
      status: 'succeeded',
      provider: 'stripe',
      provider_payment_id: invoice.payment_intent,
      receipt_url: invoice.hosted_invoice_url,
    });

    if (error) {
      console.error('Error recording payment:', error);
      throw error;
    }

    console.log('Payment recorded:', invoice.id);
  }
}

async function handlePaymentFailed(supabase: any, event: StripeEvent) {
  const invoice = event.data.object;

  const customerId = invoice.customer;

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('provider_customer_id', customerId);

  if (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }

  console.log('Payment failed for customer:', customerId);
}

function mapStripePriceToPlan(priceId: string): string {
  const priceMapping: Record<string, string> = {
    'price_monthly': 'premium_monthly',
    'price_yearly': 'premium_yearly',
  };

  return priceMapping[priceId] || 'premium_monthly';
}

function mapStripeStatus(stripeStatus: string): string {
  const statusMapping: Record<string, string> = {
    'active': 'active',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'unpaid': 'expired',
    'incomplete': 'expired',
  };

  return statusMapping[stripeStatus] || 'active';
}

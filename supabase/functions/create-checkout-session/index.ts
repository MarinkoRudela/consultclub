
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, businessName, planType } = await req.json();
    
    if (!userId) {
      throw new Error('No userId provided');
    }

    console.log('Processing checkout for user:', userId, 'business:', businessName);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user email using our secure function
    const { data: userData, error: userError } = await supabase
      .rpc('get_user_email', { user_id: userId });

    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      throw new Error('Could not fetch user email');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Check if customer already exists
    const customers = await stripe.customers.list({
      email: userData,
      limit: 1
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
      
      // Check if already subscribed
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length > 0) {
        throw new Error("You already have an active subscription");
      }
    } else {
      // Create a new customer
      customer = await stripe.customers.create({
        email: userData,
        metadata: {
          business_name: businessName,
          user_id: userId
        }
      });
    }

    console.log('Creating checkout session for customer:', customer.id);
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [{
        price: 'price_1QuGKPFVwPZEaWtpBvnV9ZRh',
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/dashboard?payment=success&email=${encodeURIComponent(userData)}`,
      cancel_url: `${req.headers.get('origin')}/signup`,
      metadata: {
        user_id: userId,
        business_name: businessName
      }
    });

    console.log('Checkout session created:', session.id);
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

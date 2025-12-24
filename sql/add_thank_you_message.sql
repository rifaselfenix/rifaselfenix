-- Add custom thank you message to raffles
ALTER TABLE public.raffles ADD COLUMN IF NOT EXISTS thank_you_message TEXT DEFAULT '¡Gracias por participar! Tus tickets están reservados. Te notificaremos cuando tu pago sea verificado.';

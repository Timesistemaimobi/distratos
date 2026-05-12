-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE'
    entity VARCHAR(50) NOT NULL, -- e.g., 'solicitacoes'
    entity_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view logs (or restrict to admins later)
CREATE POLICY "Users can view audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- System can insert logs (via authenticated user requests)
CREATE POLICY "Users can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

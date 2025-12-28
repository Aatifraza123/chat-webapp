-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create chats" ON public.chats;

-- Create permissive INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create chats" 
ON public.chats 
FOR INSERT 
TO authenticated
WITH CHECK (true);
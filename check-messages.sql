-- Check if there are any messages in the contact_messages table
SELECT 
    id,
    sender_name,
    sender_email,
    recipient_email,
    subject,
    message,
    status,
    created_at
FROM contact_messages
ORDER BY created_at DESC
LIMIT 20;

-- Check the count of messages
SELECT COUNT(*) as total_messages FROM contact_messages;

-- Check if there are any RLS policies on the table
SELECT * FROM pg_policy WHERE polrelid = 'contact_messages'::regclass;
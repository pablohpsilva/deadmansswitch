-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to encrypt text data
CREATE OR REPLACE FUNCTION encrypt_text(data text, key text)
RETURNS text AS $$
BEGIN
  RETURN encode(pgp_sym_encrypt(data, key), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Create a function to decrypt text data
CREATE OR REPLACE FUNCTION decrypt_text(encrypted_data text, key text)
RETURNS text AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted_data, 'base64'), key);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

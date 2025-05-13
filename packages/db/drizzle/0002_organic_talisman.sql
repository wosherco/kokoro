-- Custom SQL migration file, put you code below! --

-- Create trigram indexes for the name fields
CREATE INDEX idx_contact_name_given_trgm ON contact_name USING GIN (given_name gin_trgm_ops);
CREATE INDEX idx_contact_name_family_trgm ON contact_name USING GIN (family_name gin_trgm_ops);
CREATE INDEX idx_contact_name_middle_trgm ON contact_name USING GIN (middle_name gin_trgm_ops);
CREATE INDEX idx_contact_name_display_trgm ON contact_name USING GIN (display_name gin_trgm_ops);

-- Create a combined index for full name searches (optional but helpful)
CREATE INDEX idx_contact_name_full_trgm ON contact_name USING GIN (
  (COALESCE(given_name, '') || ' ' || COALESCE(middle_name, '') || ' ' || COALESCE(family_name, '')) gin_trgm_ops
);

-- PostgreSQL function to remove accents
CREATE OR REPLACE FUNCTION unaccent_string(text) RETURNS text AS $$
  SELECT translate($1,
    'áàâäãåāăąçćčđďèéêëēėęěğǵḧîïíīįìıłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźżÁÀÂÄÃÅĀĂĄÇĆČĐĎÈÉÊËĒĖĘĚĞǴḦÎÏÍĪĮÌIŁḾÑŃǸŇÔÖÒÓŒØŌÕŐṔŔŘŚŠŞȘŤȚÛÜÙÚŪǗŮŰŲẂẌŸÝŽŹŻ',
    'aaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnooooooooprrsssstttuuuuuuuuwxyyzzAAAAAAAAAACCCDDEEEEEEEEGGHIIIIIILMNNNNOOOOOOOOPRRSSSSTTUUUUUUUUWXYYZZZ'
  );
$$ LANGUAGE SQL IMMUTABLE STRICT;
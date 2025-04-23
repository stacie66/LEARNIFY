// File: scripts/setupSupabase.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin privileges

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// For running this script directly
if (require.main === module) {
  setupDatabase().catch(console.error);
}

async function setupDatabase() {
  console.log('Setting up Supabase tables...');

  try {
    // Create pdf_uploads table if it doesn't exist
    const { error: createTableError } = await supabase.rpc('create_pdf_uploads_table', {});
    
    if (createTableError) {
      console.error('Error creating pdf_uploads table:', createTableError);
      // If the function doesn't exist, we'll create the table manually
      const { error } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.pdf_uploads (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          filename TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          summary TEXT,
          FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
        );
        
        -- Add RLS policies
        ALTER TABLE public.pdf_uploads ENABLE ROW LEVEL SECURITY;
        
        -- Policy for users to see only their own PDFs
        CREATE POLICY "Users can view their own PDFs" 
          ON public.pdf_uploads FOR SELECT 
          USING (auth.uid() = user_id);
        
        -- Policy for users to insert their own PDFs
        CREATE POLICY "Users can insert their own PDFs" 
          ON public.pdf_uploads FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
        
        -- Policy for users to update their own PDFs
        CREATE POLICY "Users can update their own PDFs" 
          ON public.pdf_uploads FOR UPDATE 
          USING (auth.uid() = user_id);
        
        -- Policy for users to delete their own PDFs
        CREATE POLICY "Users can delete their own PDFs" 
          ON public.pdf_uploads FOR DELETE 
          USING (auth.uid() = user_id);
      `);
      
      if (error) {
        console.error('Error creating table manually:', error);
        return;
      }
    }
    
    // Create storage bucket if it doesn't exist
    const { error: bucketError } = await supabase.storage.createBucket('pdf_uploads', {
      public: false, // Files are not publicly accessible by default
      fileSizeLimit: 10485760, // 10MB
    });
    
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Error creating storage bucket:', bucketError);
      return;
    }
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

module.exports = { setupDatabase };
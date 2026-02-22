const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://scvfqcvyiblwysrfpzlx.supabase.co';
const supabaseKey = 'sb_publishable_4AcHkxImp8B4QJgw6pd0Kw_VgUF2Iez';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllConstraints() {
    console.log("Listing all foreign keys and their targets...");

}

listAllConstraints();

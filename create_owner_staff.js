import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://yufuecwkihuesctddawe.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZnVlY3draWh1ZXNjdGRkYXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQzODEsImV4cCI6MjA4Mzk2MDM4MX0.W5HLhFIHHkLDvXzx-usUBJGFpHR54gyfNkxs36HnY8g');

async function createOwnerStaffMembers() {
  try {
    // Find salons that don't have staff members
    const { data: salons, error: salonsError } = await supabase
      .from('salons')
      .select('id, name, owner_id, email, phone');

    if (salonsError) throw salonsError;

    console.log('Found', salons.length, 'salons');

    for (const salon of salons) {
      // Check if salon has staff members
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('salon_id', salon.id);

      if (staffError) {
        console.error('Error checking staff for salon', salon.id, staffError);
        continue;
      }

      if (staff.length === 0) {
        console.log('Creating staff member for salon:', salon.name);

        // Create staff member with salon name + owner as default
        let ownerName = `${salon.name} Eigenaar`;
        let ownerEmail = salon.email || '';

        // Create staff member
        const { data: newStaff, error: insertError } = await supabase
          .from('staff')
          .insert({
            salon_id: salon.id,
            user_id: salon.owner_id,
            name: ownerName,
            email: ownerEmail,
            phone: salon.phone || '',
            role: 'owner'
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating staff for salon', salon.id, insertError);
        } else {
          console.log('Created staff member:', newStaff.name, 'for salon:', salon.name);

          // Create service_staff assignments for all services
          const { data: services, error: servicesError } = await supabase
            .from('services')
            .select('id')
            .eq('salon_id', salon.id);

          if (!servicesError && services) {
            const serviceStaffInserts = services.map(service => ({
              service_id: service.id,
              staff_id: newStaff.id
            }));

            const { error: ssError } = await supabase
              .from('service_staff')
              .insert(serviceStaffInserts);

            if (ssError) {
              console.error('Error creating service_staff assignments:', ssError);
            } else {
              console.log('Created service assignments for', services.length, 'services');
            }
          }
        }
      } else {
        console.log('Salon', salon.name, 'already has', staff.length, 'staff members');
      }
    }

    console.log('Done processing salons');
  } catch (err) {
    console.error('Error:', err);
  }
}

createOwnerStaffMembers();
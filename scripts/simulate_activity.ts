
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY; // Using anon key is fine if RLS allows insert, otherwise service_role needed. 
// Assuming database is open or user allows public inserts for demo. If not, this might fail without service role.
// Usually local dev works.

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase Creds in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const firstNames = ['Juan', 'Maria', 'Carlos', 'Ana', 'Pedro', 'Luisa', 'Jose', 'Elena'];
const lastNames = ['Perez', 'Gomez', 'Rodriguez', 'Lopez', 'Martinez', 'Garcia', 'Fernandez'];
const methods = ['Pago Móvil', 'Zelle', 'Transferencia', 'Efectivo', 'Binance'];

async function simulate() {
    console.log("🚀 Iniciando Simulación de Mercado en Tiempo Real...");

    // Get Raffle
    const { data: raffles } = await supabase.from('raffles').select('id, price').eq('status', 'on_sale').limit(1);
    if (!raffles || raffles.length === 0) {
        console.error("❌ No hay rifas 'on_sale' para simular.");
        return;
    }
    const raffle = raffles[0];
    console.log(`🎯 Objetivo: Rifa ID ${raffle.id} - Precio $${raffle.price}`);

    let count = 0;

    // Interval
    const interval = setInterval(async () => {
        count++;
        const randomName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        const randomMethod = methods[Math.floor(Math.random() * methods.length)];
        const ticketNum = Math.floor(Math.random() * 10000);

        console.log(`[${count}] 💸 Venta Simulada: ${randomName} pagó con ${randomMethod} -> Ticket #${ticketNum}`);

        const { error } = await supabase.from('tickets').insert({
            raffle_id: raffle.id,
            ticket_number: ticketNum,
            price_paid: raffle.price,
            client_name: randomName,
            client_phone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
            client_email: `demo.${Date.now()}@test.com`,
            client_id_number: `${Math.floor(Math.random() * 30000000)}`,
            payment_method: randomMethod,
            status: 'paid', // Directamente pagado para ver $$ en dashboard
            payment_receipt_url: 'http://via.placeholder.com/150'
        });

        if (error) {
            if (error.code === '23505') console.log("   ⚠️ Ticket ocupado, reintentando...");
            else console.error("   ❌ Error:", error.message);
        } else {
            console.log("   ✅ Éxito!");
        }

        if (count >= 20) {
            console.log("🏁 Simulación terminada (20 ventas).");
            clearInterval(interval);
        }
    }, 2000); // Cada 2 segundos
}

simulate();

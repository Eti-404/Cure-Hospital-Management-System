/**
 * "নিরাময়" (Niramoy) - Pharmacy & Dispensary Controller
 * Handles prescription dispensing, inventory stock-in, and auto-deduction audit logs.
 */

const { inMemoryStore, generateUuid, isConfigured, supabase } = require('../services/dataService');

/**
 * Get Medicine Inventory for Dispensary
 * GET /api/pharmacy/medicines
 */
const getInventory = async (req, res, next) => {
  try {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('brand_name', { ascending: true });
      if (error) throw error;
      return res.json({ success: true, medicines: data || [] });
    }

    res.json({ success: true, medicines: inMemoryStore.medicines });
  } catch (error) {
    next(error);
  }
};

/**
 * Log Central Depot Stock-In
 * POST /api/pharmacy/stock-in
 */
const stockInMedicine = async (req, res, next) => {
  try {
    const { medicine_id, quantity, notes } = req.body;
    const qty = parseInt(quantity, 10);

    if (!medicine_id || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ওষুধ নির্বাচন করুন এবং সঠিক স্টক সংখ্যা প্রদান করুন।',
      });
    }

    if (isConfigured && supabase) {
      // Get current stock
      const { data: med, error: fetchErr } = await supabase
        .from('medicines')
        .select('stock_quantity')
        .eq('id', medicine_id)
        .single();
      if (fetchErr) throw fetchErr;

      const newStock = (med.stock_quantity || 0) + qty;

      // Update medicine stock
      const { data: updatedMed, error: updErr } = await supabase
        .from('medicines')
        .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
        .eq('id', medicine_id)
        .select()
        .single();
      if (updErr) throw updErr;

      // Log stock-in
      await supabase.from('medicine_stock_logs').insert({
        medicine_id,
        change_type: 'STOCK_IN',
        quantity: qty,
        notes: notes || 'সেন্ট্রাল ডিপো থেকে ওষুধ ইনটেক।',
        created_by: req.user.id,
      });

      return res.json({
        success: true,
        message: 'স্টক সফলভাবে বৃদ্ধি করা হয়েছে!',
        medicine: updatedMed,
      });
    }

    const med = inMemoryStore.medicines.find((m) => m.id === medicine_id);
    if (!med) return res.status(404).json({ success: false, message: 'ওষুধ খুঁজে পাওয়া যায়নি।' });

    med.stock_quantity += qty;
    med.updated_at = new Date().toISOString();

    inMemoryStore.medicine_stock_logs.push({
      id: generateUuid(),
      medicine_id,
      change_type: 'STOCK_IN',
      quantity: qty,
      notes: notes || 'সেন্ট্রাল ডিপো থেকে ওষুধ ইনটেক।',
      created_by: req.user.id,
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'স্টক সফলভাবে বৃদ্ধি করা হয়েছে!',
      medicine: med,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Prescriptions Ready for Dispensation
 * GET /api/pharmacy/prescriptions
 */
const getPendingPrescriptions = async (req, res, next) => {
  try {
    if (isConfigured && supabase) {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:users!prescriptions_patient_id_fkey(full_name, mobile_number, nid),
          doctor:doctor_profiles(chamber_number, designation, user:users(full_name)),
          items:prescription_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      return res.json({ success: true, prescriptions: data || [] });
    }

    const prescriptions = inMemoryStore.prescriptions.map((p) => {
      const patient = inMemoryStore.users.find((u) => u.id === p.patient_id);
      const items = inMemoryStore.prescription_items.filter((i) => i.prescription_id === p.id);
      return {
        ...p,
        patient: {
          full_name: patient?.full_name || 'রোগী',
          mobile_number: patient?.mobile_number || '01812345678',
          nid: patient?.nid || '1995123456789',
        },
        items,
      };
    });

    res.json({ success: true, prescriptions });
  } catch (error) {
    next(error);
  }
};

/**
 * Dispense a Specific Prescription Item (with Automated Stock Deduction)
 * POST /api/pharmacy/dispense-item
 */
const dispensePrescriptionItem = async (req, res, next) => {
  try {
    const { item_id, prescription_id, medicine_id, quantity = 1 } = req.body;
    const qty = parseInt(quantity, 10);

    if (!item_id) {
      return res.status(400).json({ success: false, message: 'প্রেসক্রিপশন আইটেম আইডি প্রদান করুন।' });
    }

    if (isConfigured && supabase) {
      // 1. Mark Item as Dispensed
      const { data: item, error: itemErr } = await supabase
        .from('prescription_items')
        .update({
          is_dispensed: true,
          dispensed_at: new Date().toISOString(),
        })
        .eq('id', item_id)
        .select()
        .single();
      if (itemErr) throw itemErr;

      // 2. If item is linked to government inventory, deduct stock
      if (medicine_id) {
        const { data: med } = await supabase
          .from('medicines')
          .select('stock_quantity')
          .eq('id', medicine_id)
          .single();

        if (med) {
          const updatedStock = Math.max(0, (med.stock_quantity || 0) - qty);
          await supabase
            .from('medicines')
            .update({ stock_quantity: updatedStock, updated_at: new Date().toISOString() })
            .eq('id', medicine_id);

          await supabase.from('medicine_stock_logs').insert({
            medicine_id,
            change_type: 'DISPENSED',
            quantity: qty,
            reference_prescription_id: prescription_id || null,
            notes: 'রোগীর ডিজিটাল প্রেসক্রিপশনে কাউন্টার থেকে বিতরণ।',
            created_by: req.user.id,
          });
        }
      }

      return res.json({
        success: true,
        message: 'ওষুধ সফলভাবে বিতরণ করা হয়েছে এবং স্টক সমন্বয় করা হয়েছে!',
        item,
      });
    }

    // In-memory fallback
    const item = inMemoryStore.prescription_items.find((i) => i.id === item_id);
    if (!item) return res.status(404).json({ success: false, message: 'আইটেম পাওয়া যায়নি।' });

    item.is_dispensed = true;
    item.dispensed_at = new Date().toISOString();

    if (medicine_id || item.medicine_id) {
      const targetMedId = medicine_id || item.medicine_id;
      const med = inMemoryStore.medicines.find((m) => m.id === targetMedId);
      if (med) {
        med.stock_quantity = Math.max(0, med.stock_quantity - qty);
        med.updated_at = new Date().toISOString();

        inMemoryStore.medicine_stock_logs.push({
          id: generateUuid(),
          medicine_id: targetMedId,
          change_type: 'DISPENSED',
          quantity: qty,
          reference_prescription_id: prescription_id || null,
          notes: 'রোগীর ডিজিটাল প্রেসক্রিপশনে কাউন্টার থেকে বিতরণ।',
          created_by: req.user.id,
          created_at: new Date().toISOString(),
        });
      }
    }

    res.json({
      success: true,
      message: 'ওষুধ সফলভাবে বিতরণ করা হয়েছে এবং স্টক সমন্বয় করা হয়েছে!',
      item,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  stockInMedicine,
  getPendingPrescriptions,
  dispensePrescriptionItem,
};

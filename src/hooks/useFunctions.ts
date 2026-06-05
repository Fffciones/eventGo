import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Function {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  price_mei: number;
  price_diarista: number;
  base_pay_mei: number;
  base_pay_diarista: number;
  display_order: number;
}

export function useFunctions() {
  const [functions, setFunctions] = useState<Function[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('functions')
      .select('*')
      .eq('active', true)
      .order('display_order')
      .then(({ data }) => {
        setFunctions(data ?? []);
        setLoading(false);
      });
  }, []);

  return { functions, loading };
}

export async function getProfessionalFunctions(professionalId: string): Promise<Function[]> {
  const { data } = await supabase
    .from('professional_functions')
    .select('functions(*)')
    .eq('professional_id', professionalId);

  return (data ?? []).map((row: any) => row.functions).filter(Boolean);
}

export async function setProfessionalFunctions(
  professionalId: string,
  functionIds: string[]
): Promise<void> {
  await supabase
    .from('professional_functions')
    .delete()
    .eq('professional_id', professionalId);

  if (functionIds.length > 0) {
    await supabase.from('professional_functions').insert(
      functionIds.map(function_id => ({ professional_id: professionalId, function_id }))
    );
  }
}

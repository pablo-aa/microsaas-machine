// Supabase Edge Function: manage-coupons
// Purpose: CRUD operations for discount coupons with SERVICE_ROLE_KEY
// Author: QC Admin Panel

import { createClient } from "jsr:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    const method = req.method;

    // GET - List all coupons with calculated status
    if (method === "GET") {
      const { data, error } = await supabase
        .from("discount_coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate status for each coupon
      const couponsWithStatus = data.map((coupon) => {
        let status = "ativo";
        if (!coupon.is_active) {
          status = "inativo";
        } else if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          status = "expirado";
        } else if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
          status = "esgotado";
        }
        return { ...coupon, status };
      });

      return new Response(JSON.stringify(couponsWithStatus), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - Create new coupon
    if (method === "POST") {
      const body = await req.json();

      // Validate required fields
      if (!body.code || body.discount_percentage === undefined) {
        return new Response(
          JSON.stringify({ error: "Campos obrigatórios: code, discount_percentage" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate code format
      const code = body.code.toUpperCase().trim();
      if (code.length < 4 || code.length > 50) {
        return new Response(
          JSON.stringify({ error: "Código deve ter entre 4 e 50 caracteres" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!/^[A-Z0-9]+$/.test(code)) {
        return new Response(
          JSON.stringify({ error: "Código deve conter apenas letras e números" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate discount percentage (accepts decimals up to 2 places)
      const discount = parseFloat(body.discount_percentage);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        return new Response(
          JSON.stringify({ error: "Desconto deve estar entre 0% e 100%" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate max 2 decimal places
      const discountStr = body.discount_percentage.toString();
      const decimalParts = discountStr.split('.');
      if (decimalParts.length > 1 && decimalParts[1].length > 2) {
        return new Response(
          JSON.stringify({ error: "Desconto deve ter no máximo 2 casas decimais" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate max_uses
      let maxUses = null;
      if (body.max_uses !== null && body.max_uses !== undefined && body.max_uses !== "") {
        maxUses = parseInt(body.max_uses);
        if (isNaN(maxUses) || maxUses < 1) {
          return new Response(
            JSON.stringify({ error: "Máximo de usos deve ser maior que 0 ou vazio (ilimitado)" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Validate expires_at
      let expiresAt = null;
      if (body.expires_at && body.expires_at !== "") {
        expiresAt = body.expires_at;
        const expireDate = new Date(expiresAt);
        if (isNaN(expireDate.getTime())) {
          return new Response(
            JSON.stringify({ error: "Data de expiração inválida" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Insert coupon
      const { data, error } = await supabase
        .from("discount_coupons")
        .insert({
          code,
          discount_percentage: discount,
          description: body.description || null,
          is_active: body.is_active !== undefined ? body.is_active : true,
          expires_at: expiresAt,
          max_uses: maxUses,
        })
        .select()
        .single();

      if (error) {
        // Check for duplicate code
        if (error.code === "23505") {
          return new Response(
            JSON.stringify({ error: "Já existe um cupom com este código" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw error;
      }

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PATCH - Update coupon
    if (method === "PATCH") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(
          JSON.stringify({ error: "ID do cupom é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();

      // Don't allow editing code or current_uses
      const updateData: any = {};

      if (body.discount_percentage !== undefined) {
        const discount = parseFloat(body.discount_percentage);
        if (isNaN(discount) || discount < 0 || discount > 100) {
          return new Response(
            JSON.stringify({ error: "Desconto deve estar entre 0% e 100%" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate max 2 decimal places
        const discountStr = body.discount_percentage.toString();
        const decimalParts = discountStr.split('.');
        if (decimalParts.length > 1 && decimalParts[1].length > 2) {
          return new Response(
            JSON.stringify({ error: "Desconto deve ter no máximo 2 casas decimais" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        updateData.discount_percentage = discount;
      }

      if (body.description !== undefined) {
        updateData.description = body.description || null;
      }

      if (body.is_active !== undefined) {
        updateData.is_active = body.is_active;
      }

      if (body.expires_at !== undefined) {
        updateData.expires_at = body.expires_at || null;
      }

      if (body.max_uses !== undefined) {
        if (body.max_uses === null || body.max_uses === "") {
          updateData.max_uses = null;
        } else {
          const maxUses = parseInt(body.max_uses);
          if (isNaN(maxUses) || maxUses < 1) {
            return new Response(
              JSON.stringify({ error: "Máximo de usos deve ser maior que 0 ou vazio (ilimitado)" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          updateData.max_uses = maxUses;
        }
      }

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("discount_coupons")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return new Response(
          JSON.stringify({ error: "Cupom não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE - Delete coupon (only if not used)
    if (method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(
          JSON.stringify({ error: "ID do cupom é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if coupon has been used
      const { data: coupon, error: fetchError } = await supabase
        .from("discount_coupons")
        .select("code, current_uses")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      if (!coupon) {
        return new Response(
          JSON.stringify({ error: "Cupom não encontrado" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (coupon.current_uses > 0) {
        return new Response(
          JSON.stringify({
            error: `Este cupom já foi usado ${coupon.current_uses} vez(es). Recomendamos desativar ao invés de excluir.`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete coupon
      const { error: deleteError } = await supabase
        .from("discount_coupons")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ message: "Cupom excluído com sucesso" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in manage-coupons:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


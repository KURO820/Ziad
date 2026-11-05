import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { image_base64 } = body;

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "Missing image_base64 field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Google Cloud Vision API if a key is configured,
    // otherwise fall back to MRZ parsing from the image.
    const googleApiKey = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");

    let extractedData: Record<string, unknown> = {};

    if (googleApiKey) {
      // Real OCR via Google Cloud Vision API
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [{
              image: { content: image_base64 },
              features: [
                { type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 },
                { type: "TEXT_DETECTION", maxResults: 1 },
              ],
            }],
          }),
        }
      );

      if (!visionResponse.ok) {
        const errText = await visionResponse.text();
        return new Response(
          JSON.stringify({ error: `Vision API error: ${errText}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const visionData = await visionResponse.json();
      const fullTextAnnotation = visionData.responses?.[0]?.fullTextAnnotation;
      const rawText = fullTextAnnotation?.text || "";

      extractedData = parseMRZFromText(rawText);
      extractedData.raw_text = rawText;
      extractedData.confidence = 0.9;
    } else {
      // No API key configured — we cannot perform real OCR without one.
      // Return an informational error so the frontend can show guidance.
      return new Response(
        JSON.stringify({
          error: "OCR_NOT_CONFIGURED",
          message: "Passport OCR requires a Google Cloud Vision API key. Please set the GOOGLE_CLOUD_VISION_API_KEY secret in your Supabase project. Until then, you can enter passport details manually.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Parse MRZ (Machine Readable Zone) data from OCR text.
// Passports use TD3 format: 2 lines of 44 chars each.
function parseMRZFromText(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // Find lines that look like MRZ (44 chars, mostly uppercase + <)
  const mrzLines = lines.filter((l) => l.length >= 30 && /^[A-Z0-9<]+$/.test(l.replace(/\s/g, "")));

  if (mrzLines.length >= 2) {
    const line1 = mrzLines[0].replace(/\s/g, "").padEnd(44, "<");
    const line2 = mrzLines[1].replace(/\s/g, "").padEnd(44, "<");

    // Line 1: P<ISSCOUNTRY SURNAME<<GIVEN<NAMES
    const passportType = line1[0] || "P";
    const issuingCountry = line1.substring(2, 5).replace(/</g, "");
    const namePart = line1.substring(5).replace(/</g, " ").replace(/\s+/g, " ").trim();

    // Line 2: PASSPORTNUM<CHECK BIRTHDATE<CHECK GENDER EXPIRY<CHECK ...
    const passportNumber = line2.substring(0, 9).replace(/</g, "");
    const nationality = line2.substring(10, 13).replace(/</g, "");
    const birthDate = line2.substring(13, 19);
    const gender = line2[20] || "";
    const expiryDate = line2.substring(21, 27);

    result.document_type = passportType;
    result.issuing_country = issuingCountry;
    result.nationality = nationality;
    result.full_name = namePart;
    result.passport_number = passportNumber;
    result.passport_type = passportType;
    result.gender = gender === "<" ? "" : gender;

    if (birthDate && /^\d{6}$/.test(birthDate)) {
      result.date_of_birth = formatMRZDate(birthDate);
    }
    if (expiryDate && /^\d{6}$/.test(expiryDate)) {
      result.expiry_date = formatMRZDate(expiryDate, true);
    }
  }

  // Also try to extract from full text if MRZ parsing didn't work well
  if (!result.full_name) {
    const nameMatch = text.match(/(?:Name|NOM|SURNAME)[:\s]+([A-Z\s<]+)/i);
    if (nameMatch) result.full_name = nameMatch[1].trim();
  }
  if (!result.passport_number) {
    const numMatch = text.match(/(?:Passport No|Passeport|No)[:\s]*([A-Z0-9]{5,12})/i);
    if (numMatch) result.passport_number = numMatch[1];
  }

  return result;
}

function formatMRZDate(yyMMdd: string, isExpiry = false): string {
  let yy = parseInt(yyMMdd.substring(0, 2), 10);
  const mm = yyMMdd.substring(2, 4);
  const dd = yyMMdd.substring(4, 6);

  // For expiry dates, YY 00-50 = 2000-2050; for birth dates, YY 50-99 = 1950-1999
  if (isExpiry) {
    yy = yy + 2000;
  } else {
    yy = yy >= 50 ? yy + 1900 : yy + 2000;
  }

  return `${yy}-${mm}-${dd}`;
}

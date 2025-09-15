/**
 * Lightweight Google Sheets API client using direct HTTP requests
 * This avoids the heavy googleapis package and improves build times
 */

interface EarlyAccessApplication {
  firstName: string;
  lastName: string;
  companyWebsite: string;
  companyEmail: string;
  phoneNumber?: string;
}

interface GoogleSheetsResponse {
  values?: string[][];
}

interface GoogleSheetsAppendResponse {
  updates?: {
    updatedRows?: number;
  };
}

export async function writeToGoogleSheet(application: EarlyAccessApplication): Promise<{success: boolean, message: string}> {
  try {
    // Validate environment variable
    if (!process.env.GOOGLE_API_JSON) {
      throw new Error("GOOGLE_API_JSON environment variable is not set");
    }

    const SPREADSHEET_ID = "1KymdkmOcMvC5B6MLrR_Aoue27_6fCaJIHbcNFWvkpbs";
    
    // Parse credentials
    const credentials = JSON.parse(
      Buffer.from(process.env.GOOGLE_API_JSON, "base64").toString()
    );

    // Get access token using JWT
    const accessToken = await getAccessToken(credentials);
    
    // Check if email already exists
    const checkResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!D:D`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!checkResponse.ok) {
      throw new Error(`Failed to check existing emails: ${checkResponse.statusText}`);
    }

    const checkData: GoogleSheetsResponse = await checkResponse.json();
    const rows = checkData.values || [];

    // Check if email already exists
    const exists = rows.some((row) => row[0] === application.companyEmail);
    
    if (exists) {
      console.log(`Email ${application.companyEmail} already exists in the sheet`);
      return {success: false, message: "You have already applied for early access."};
    }

    // Append new application
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet1!A:E:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[
            application.firstName, 
            application.lastName, 
            application.companyWebsite, 
            application.companyEmail, 
            application.phoneNumber || ""
          ]],
        }),
      }
    );

    if (!appendResponse.ok) {
      throw new Error(`Failed to append data: ${appendResponse.statusText}`);
    }

    const appendData: GoogleSheetsAppendResponse = await appendResponse.json();
    console.log(`Successfully added ${appendData.updates?.updatedRows || 1} row(s) to the sheet`);

    return {success: true, message: "Early access request submitted successfully"};
  } catch (error) {
    console.error("Error writing to Google Sheet:", error);
    return {success: false, message: "Failed to submit early access request. Please try again."};
  }
}

/**
 * Get access token using JWT authentication
 */
async function getAccessToken(credentials: any): Promise<string> {
  const jwt = require('jsonwebtoken');
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const token = jwt.sign(payload, credentials.private_key, { algorithm: 'RS256' });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

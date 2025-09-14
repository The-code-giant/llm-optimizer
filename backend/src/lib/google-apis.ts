import { google } from "googleapis";


const SPREADSHEET_ID = "1KymdkmOcMvC5B6MLrR_Aoue27_6fCaJIHbcNFWvkpbs"

export async function writeToGoogleSheet(application: any) : Promise<{success: boolean, message: string}> {



    const credentials = JSON.parse(
        Buffer.from(process.env.GOOGLE_API_JSON as string, "base64").toString()
      );
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const sheets = google.sheets({ version: "v4", auth: await auth.getClient() as any });

      // check if user with email already exists

      const res = await sheets.spreadsheets.values.get({
       spreadsheetId: SPREADSHEET_ID,
        range: "Sheet1!D:D", // only column A
      });
      
      const rows = res.data.values || [];
            
      // Check if email already exists
      const exists = rows.some((row) => row[0] === application.companyEmail);
      
      if (exists) {
        console.log(`Email ${application.companyEmail} already exists in the sheet`);
        return {success: true, message: "You have already applied for early access."};
      }

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "Sheet1!A:E", // change based on your columns
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[application.firstName, application.lastName, application.companyWebsite, application.companyEmail, application.phoneNumber]],
        },
      });

      return {success: true, message: "Early access request submitted successfully"};
}
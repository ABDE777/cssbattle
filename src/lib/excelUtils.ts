import * as XLSX from 'xlsx';

export interface PlayerData {
  full_name: string;
  email: string;
  group_name: string;
  phone?: string;
  cssbattle_profile_link?: string;
  verified_ofppt?: boolean;
}

/**
 * Parse Excel file and extract player data
 * @param file Excel file to parse
 * @returns Promise resolving to array of player data
 */
export const parseExcelFile = (file: File): Promise<PlayerData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON with proper typing
        const jsonData: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(worksheet);
        
        // Validate and transform data
        const players: PlayerData[] = jsonData.map((row) => {
          // Handle different possible column names
          const fullName = row.full_name || row.FullName || row['Full Name'] || row.name || row.Name;
          const email = row.email || row.Email;
          const groupName = row.group_name || row.GroupName || row['Group Name'] || row.group || row.Group;
          const phone = row.phone || row.Phone;
          const cssLink = row.cssbattle_profile_link || row.CSSBattleProfileLink || 
                         row['CSS Battle Profile Link'] || row.css_link || row.CSSLink;
          const verifiedOfppt = row.verified_ofppt || row.VerifiedOfppt || 
                               row['Verified OFPPT'] || row.verified || row.Verified;
          
          if (!fullName || !email || !groupName) {
            throw new Error('Missing required fields: full_name, email, and group_name are required');
          }
          
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email.toString())) {
            throw new Error(`Invalid email format: ${email}`);
          }
          
          return {
            full_name: fullName.toString().trim(),
            email: email.toString().trim(),
            group_name: groupName.toString().trim(),
            phone: phone ? phone.toString().trim() : undefined,
            cssbattle_profile_link: cssLink ? cssLink.toString().trim() : undefined,
            verified_ofppt: verifiedOfppt ? verifiedOfppt.toString().toLowerCase() === 'true' : false
          };
        });
        
        resolve(players);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${(error as Error).message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Create template Excel file for player import
 * @returns Blob containing the template Excel file
 */
export const createPlayerTemplate = (): Blob => {
  // Create worksheet data
  const templateData = [
    ['full_name', 'email', 'group_name', 'phone', 'cssbattle_profile_link', 'verified_ofppt'],
    ['John Doe', 'john.doe@example.com', 'DD101', '123-456-7890', 'https://cssbattle.dev/player/johndoe', 'true'],
    ['Jane Smith', 'jane.smith@example.com', 'DD102', '098-765-4321', 'https://cssbattle.dev/player/janesmith', 'false']
  ];
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Players');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Convert to Blob
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Generate a filename for the template
 * @returns Template filename
 */
export const getPlayerTemplateFilename = (): string => {
  return 'players_template.xlsx';
};
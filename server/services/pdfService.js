const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateCardPDF = async (applicationData) => {
   try {
      const browser = await puppeteer.launch({
         headless: 'new',
         args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      // Load the logo image
      const logoPath = path.join(__dirname, '../../public/logo.png');
      const logoBase64 = fs.existsSync(logoPath)
         ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
         : '';

      // Convert uploaded images to base64 for embedding
      const photoBase64 = applicationData.documents.photoPath
         ? `data:image/png;base64,${fs.readFileSync(applicationData.documents.photoPath).toString('base64')}`
         : '';
      const aadhaarBase64 = applicationData.documents.aadhaarPath
         ? `data:image/png;base64,${fs.readFileSync(applicationData.documents.aadhaarPath).toString('base64')}`
         : '';
      const panBase64 = applicationData.documents.panPath
         ? `data:image/png;base64,${fs.readFileSync(applicationData.documents.panPath).toString('base64')}`
         : '';

      // Digital Identity Card Template (ID card style)
      const isPremier = applicationData.applicationType === 'Premier' || applicationData.applicationType === 'Premium'; // Handle legacy 'Premium'
      const validityPeriod = isPremier ? '1 Year' : '3 Months';
      const cardTitle = isPremier ? 'Premier Card' : 'Free Card';
      const cardColor = isPremier ? '#EA7F32' : '#164E4D'; // Orange for Premier, Teal for Free

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', sans-serif; 
            background: #fff;
            padding: 40px;
          }
          .page-container {
             max-width: 800px;
             margin: 0 auto;
             border: 1px solid #e5e5e5;
             border-radius: 0; /* A4 style usually distinct pages */
          }
          .id-card {
             width: 100%;
             background: white;
             /* border: 1px solid #ddd; */
             overflow: hidden;
             position: relative;
          }
          .card-header {
             background: linear-gradient(135deg, #164E4D 0%, #0f3535 100%);
             padding: 24px 32px;
             color: white;
             display: flex;
             justify-content: space-between;
             align-items: center;
             border-bottom: 4px solid #EA7F32;
          }
          .logo-area img {
             height: 48px;
             width: auto;
          }
          .logo-text {
             font-size: 24px;
             font-weight: 800;
             color: #fff;
             text-transform: uppercase;
             letter-spacing: 1px;
          }
          .card-badge {
             background: ${cardColor};
             color: white;
             padding: 6px 16px;
             border-radius: 4px;
             font-size: 14px;
             font-weight: 700;
             text-transform: uppercase;
             letter-spacing: 0.5px;
          }
          
          .main-content {
             padding: 32px;
             display: flex;
             gap: 32px;
             border-bottom: 2px dashed #e5e5e5;
          }
          
          .photo-box {
             width: 160px;
             flex-shrink: 0;
          }
          .photo {
             width: 150px;
             height: 180px;
             border-radius: 8px;
             object-fit: cover;
             border: 2px solid #164E4D;
             box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          }
          .photo-placeholder {
             width: 150px;
             height: 180px;
             background: #f0f0f0;
             border: 2px dashed #ccc;
             display: flex;
             align-items: center;
             justify-content: center;
             color: #666;
             font-size: 12px;
          }
          
          .details-grid {
             flex-grow: 1;
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 16px 24px;
          }
          .field-group {
             display: flex;
             flex-direction: column;
          }
          .field-label {
             font-size: 11px;
             color: #666;
             text-transform: uppercase;
             font-weight: 600;
             margin-bottom: 4px;
          }
          .field-value {
             font-size: 15px;
             color: #111;
             font-weight: 600;
             border-bottom: 1px solid #eee;
             padding-bottom: 2px;
          }
          
          .validity-box {
             grid-column: span 2;
             margin-top: 8px;
             background: #f8f9fa;
             padding: 12px;
             border-radius: 6px;
             border-left: 4px solid ${cardColor};
             display: flex;
             justify-content: space-between;
             align-items: center;
          }
          .unique-code {
             font-family: 'Courier New', monospace;
             font-size: 18px;
             font-weight: 700;
             color: #164E4D;
             letter-spacing: 1px;
          }

          /* Hindi Terms Section */
          .terms-section {
             padding: 32px;
             font-family: 'Noto Sans Devanagari', sans-serif;
             font-size: 12px;
             color: #333;
             line-height: 1.6;
             background: #fff;
          }
          .terms-header {
             font-size: 16px;
             font-weight: 700;
             color: #164E4D;
             margin-bottom: 16px;
             border-bottom: 1px solid #eee;
             padding-bottom: 8px;
          }
          .terms-grid {
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 32px;
          }
          .term-block h4 {
             font-size: 14px;
             color: #EA7F32;
             margin-bottom: 8px;
             font-weight: 700;
          }
          .term-list {
             list-style: none;
          }
          .term-list li {
             margin-bottom: 6px;
             position: relative;
             padding-left: 12px;
          }
          .term-list li::before {
             content: "•";
             position: absolute;
             left: 0;
             color: #EA7F32;
          }
          
          .footer {
             background: #f1f5f9;
             padding: 16px 32px;
             text-align: center;
             font-size: 11px;
             color: #64748b;
             border-top: 1px solid #e2e8f0;
          }
          
          .watermark {
             position: absolute;
             top: 40%;
             left: 50%;
             transform: translate(-50%, -50%) rotate(-30deg);
             font-size: 100px;
             font-weight: 900;
             color: rgba(22, 78, 77, 0.03);
             pointer-events: none;
             z-index: 0;
             white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
           <div class="id-card">
              <!-- Header -->
              <div class="card-header">
                 <div class="logo-area">
                    ${logoBase64 ? `<img src="${logoBase64}" alt="Bharat Peak Business" />` : '<div class="logo-text">Bharat Peak Business</div>'}
                 </div>
                 <div class="card-badge">${cardTitle}</div>
              </div>

              <!-- Main Card Info -->
              <div class="main-content">
                 <div class="photo-box">
                    ${photoBase64
            ? `<img src="${photoBase64}" class="photo" alt="User Photo" />`
            : '<div class="photo-placeholder">No Photo</div>'}
                 </div>
                 
                 <div class="details-grid">
                    <div class="field-group">
                       <span class="field-label">Name / नाम</span>
                       <span class="field-value">${applicationData.personalDetails.fullName}</span>
                    </div>
                    <div class="field-group">
                       <span class="field-label">Mobile / मोबाइल</span>
                       <span class="field-value">${applicationData.personalDetails.mobile}</span>
                    </div>
                    <div class="field-group">
                       <span class="field-label">Gender / लिंग</span>
                       <span class="field-value">${applicationData.personalDetails.gender || '-'}</span>
                    </div>
                    <div class="field-group">
                       <span class="field-label">Aadhaar No. / आधार संख्या</span>
                       <span class="field-value">${applicationData.personalDetails.aadhaarNumber || '-'}</span>
                    </div>
                    <div class="field-group">
                       <span class="field-label">City / शहर</span>
                       <span class="field-value">${applicationData.personalDetails.city || '-'}</span>
                    </div>
                    <div class="field-group">
                       <span class="field-label">State / राज्य</span>
                       <span class="field-value">${applicationData.personalDetails.state || '-'}</span>
                    </div>
                    
                    <div class="validity-box">
                       <div>
                          <div class="field-label">Unique Card Code</div>
                          <div class="unique-code">${applicationData.uniqueCode || 'PENDING'}</div>
                       </div>
                       <div style="text-align: right;">
                          <div class="field-label">Validity</div>
                          <div class="field-value" style="border:none;">${validityPeriod}</div>
                       </div>
                    </div>
                 </div>
              </div>

              <!-- Terms & Details (Hindi) -->
              <div class="terms-section">
                 <div class="terms-header">CARD INFORMATION & TERMS</div>
                 
                 <div class="terms-grid">
                    <div class="term-block">
                       <h4>ड्यूटी / सुविधाएँ</h4>
                       <ul class="term-list">
                          <li>परामर्श का समय सुबह 9:30 से लेकर शाम 5:00 तक होगा।</li>
                          <li>Emergency स्थिति में अपना हेल्थ कार्ड कोई मदद नहीं कर सकता।</li>
                          <li>दवाइयों एवं जाँच पर छूट की सुविधा उपलब्ध होगी, जहाँ हमारे पार्टनर जुड़े होंगे। उदाहरण: Ultrasound, MRI, CT Scan, Labs.</li>
                          <li>दवाइयों में वही छूट मिलेगी जहां हमारे पार्टनर होंगे। अन्यथा CT Scan, Ultrasound, MRI आप पूछ कर कही भी करवा सकते हो, डॉक्टर की स्लिप भेजने के बाद।</li>
                       </ul>
                       
                       <h4 style="margin-top: 16px;">नियम एवं शर्तें (Terms & Conditions)</h4>
                       <ul class="term-list">
                          <li>बिना कारण यदि आप कोई सर्विस लेते हैं, तो उस पर मिलने वाले डिस्काउंट के लिए हम जिम्मेदार नहीं होंगे।</li>
                          <li>अगर आपके इलाके में पार्टनर नहीं होंगे, तो हम डिस्काउंट के लिए जिम्मेदार नहीं होंगे।</li>
                          <li>इस कार्ड की वैधता: ${validityPeriod} (Free: 3 महीने, Premier: 1 साल)। इसके बाद रिनिवल करवा सकते हैं।</li>
                       </ul>
                    </div>
                    
                    <div class="term-block">
                       <h4>अपना हेल्थ कार्ड से जुड़ी जानकारी</h4>
                       <ul class="term-list">
                          <li>अपना हेल्थ कार्ड के माध्यम से आप अपने और अपने परिवार में होने वाली बीमारियों के खर्चे से बच सकते हैं।</li>
                          <li>इस कार्ड के माध्यम से आप अपने क्षेत्र में उपलब्ध OPD, MRI, X-Ray, जाँच और दवाइयों पर होने वाले खर्चे से बच सकते हैं।</li>
                          <li>अगर आपके पास यह कार्ड होगा, तो आप अपने आस-पास के OPD / हॉस्पिटल / क्लिनिक में इलाज करा पाएँगे, जहाँ हमारे पार्टनर हॉस्पिटल जुड़े होंगे।</li>
                          <li>इस कार्ड के माध्यम से OPD से संबंधित खर्च को सुरक्षित रखा जा सकता है, बिना किसी झंझट के।</li>
                          <li>स्कूल के बच्चों के लिए Paid Card की सुविधा उपलब्ध है।</li>
                       </ul>
                    </div>
                 </div>
              </div>

              <div class="watermark">BHARAT PEAK</div>
              
              <div class="footer">
                 This is a Digital Health Identity Card issued by Bharat Peak Business. • support@bharatpeak.com
              </div>
           </div>
        </div>
      </body>
      </html>
      `;

      await page.setContent(htmlContent);
      const pdfBuffer = await page.pdf({
         format: 'A4',
         printBackground: true,
         landscape: false
      });

      await browser.close();
      return pdfBuffer;
   } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
   }
};

module.exports = { generateCardPDF };

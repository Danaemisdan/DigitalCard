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

      // Load the logo image (Prioritize SVG for quality)
      const logoSvgPath = path.join(__dirname, '../../public/logo.svg');
      const logoPngPath = path.join(__dirname, '../../public/logo.png');

      let logoBase64 = '';
      if (fs.existsSync(logoSvgPath)) {
         logoBase64 = `data:image/svg+xml;base64,${fs.readFileSync(logoSvgPath).toString('base64')}`;
      } else if (fs.existsSync(logoPngPath)) {
         logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPngPath).toString('base64')}`;
      }

      // Convert uploaded images to base64 for embedding
      const photoBase64 = applicationData.documents.photoPath
         ? `data:image/png;base64,${fs.readFileSync(applicationData.documents.photoPath).toString('base64')}`
         : '';

      // Digital Identity Card Template (Gold Card Style)
      const isPremier = applicationData.applicationType === 'Premier' || applicationData.applicationType === 'Premium';
      const validityPeriod = isPremier ? '1 Year' : '3 Months';
      const cardTitle = isPremier ? 'Premier Card' : 'Free Card';

      // Calculate Expiry Date
      const expiryDate = isPremier
         ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
         : new Date(new Date().setMonth(new Date().getMonth() + 3));
      const formattedExpiry = expiryDate.toLocaleDateString('en-GB');

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', 'Noto Sans Devanagari', sans-serif; 
            background: #fff;
            padding: 40px; /* More padding for page */
            -webkit-print-color-adjust: exact;
          }
          .page-container {
             max-width: 800px;
             margin: 0 auto;
          }
          
          /* --- CARD COMMON STYLES --- */
          .card-shared {
             width: 100%;
             max-width: 500px; /* Standard ID width */
             margin: 0 auto 30px; /* Space between Front/Back */
             border-radius: 16px;
             overflow: hidden;
             box-shadow: 0 8px 20px rgba(0,0,0,0.15);
             position: relative;
             border: 1px solid rgba(0,0,0,0.1);
          }

          /* --- FRONT SIDE (Orange/Green) --- */
          .card-front {
             background: linear-gradient(135deg, #FF9933 0%, #FFFFFF 45%, #FFFFFF 55%, #138808 100%);
             border: 2px solid #FF9933;
             min-height: 300px;
          }

          /* Header Section */
          .card-header {
             display: flex;
             justify-content: space-between;
             align-items: flex-start;
             padding: 16px 24px;
             background: rgba(255,255,255,0.25);
             border-bottom: 1px solid rgba(255,255,255,0.4);
             backdrop-filter: blur(5px);
          }
          .header-left {
             display: flex;
             flex-direction: column;
          }
          .company-name {
             font-size: 18px; /* Slightly smaller for long name */
             font-weight: 900;
             color: #000;
             text-transform: uppercase;
             line-height: 1.1;
             letter-spacing: -0.5px;
             margin-bottom: 2px;
          }
          .company-tagline {
             font-size: 10px;
             font-weight: 700; /* Bolder */
             color: #1f2937;
             text-transform: uppercase;
             letter-spacing: 0.5px;
             font-style: italic;
          }
          .company-sub {
             font-size: 9px;
             font-weight: 700;
             color: #fff;
             margin-top: 4px;
             padding: 2px 8px;
             background: #B45309;
             display: inline-block;
             width: fit-content;
             border-radius: 12px;
          }
          
          .header-right {
             display: flex;
             flex-direction: column;
             align-items: flex-end;
             gap: 6px;
          }
          .logo-img {
             height: 40px;
             width: auto;
             filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
          }
          
          .card-type-badge {
             font-family: 'Inter', sans-serif;
             font-size: 10px;
             font-weight: 800;
             letter-spacing: 0.5px;
             text-transform: uppercase;
             background: linear-gradient(90deg, #EA580C, #15803d);
             color: white;
             padding: 4px 12px;
             border-radius: 20px;
             box-shadow: 0 4px 10px rgba(0,0,0,0.15);
             border: 1px solid rgba(255,255,255,0.5);
             text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          }

          /* Card Body Grid */
          .card-body {
             padding: 20px 24px;
             display: grid;
             grid-template-columns: 80px 1fr 90px;
             grid-template-rows: auto auto;
             gap: 15px;
             align-items: start;
          }
           
          /* Watermark */
          .bg-watermark {
             position: absolute;
             top: 50%;
             left: 50%;
             transform: translate(-50%, -50%) rotate(-30deg);
             font-size: 60px;
             font-weight: 900;
             color: rgba(0,0,0,0.04);
             pointer-events: none;
             white-space: nowrap;
             z-index: 0;
          }

          .photo-box {
             grid-column: 1;
             grid-row: 2;
             width: 80px;
             height: 100px;
             border-radius: 8px;
             border: 3px solid #fff;
             overflow: hidden;
             background: #e5e7eb;
             box-shadow: 0 4px 6px rgba(0,0,0,0.1);
             z-index: 2;
          }
          .photo { width: 100%; height: 100%; object-fit: cover; }

          .user-header-info {
             grid-column: 1 / -1;
             grid-row: 1;
             margin-bottom: 5px;
             z-index: 2;
             border-bottom: 1px solid rgba(0,0,0,0.05);
             padding-bottom: 15px;
          }
          .user-name {
             font-size: 22px;
             font-weight: 800;
             color: #111827;
             text-transform: uppercase;
             line-height: 1.1;
          }
          .user-id {
             font-size: 14px;
             font-weight: 700;
             color: #15803d;
             letter-spacing: 0.5px;
             margin-top: 2px;
             font-family: monospace;
          }

          .user-details-list {
             grid-column: 2;
             grid-row: 2;
             display: flex;
             flex-direction: column;
             justify-content: center;
             font-size: 11px;
             font-weight: 600;
             color: #374151;
             line-height: 1.8;
             padding-left: 10px;
             z-index: 2;
             height: 100px;
          }
          .detail-item { display: flex; align-items: baseline; }
          .detail-label {
             width: 55px;
             font-weight: 800;
             color: #9a3412;
             font-size: 9px;
             text-transform: uppercase;
          }
          .detail-value { color: #000; font-weight: 700; font-size: 12px; }

          .qr-section {
             grid-column: 3;
             grid-row: 2;
             width: 90px;
             height: 90px;
             background: #fff;
             padding: 4px;
             border-radius: 8px;
             border: 1px solid rgba(0,0,0,0.1);
             box-shadow: 0 4px 8px rgba(0,0,0,0.1);
             display: flex;
             justify-content: center;
             align-items: center;
             z-index: 2;
             align-self: center;
          }

          /* --- BACK SIDE (Clean White/Gray) --- */
          .card-back {
             background: #f9fafb;
             border: 2px solid #e5e7eb;
             min-height: 300px;
             display: flex;
             flex-direction: column;
             justify-content: space-between;
             padding: 24px;
          }
          
          .back-header {
             text-align: center;
             margin-bottom: 20px;
             border-bottom: 2px solid #FF9933;
             padding-bottom: 10px;
          }
          .back-company-name {
             font-size: 16px; 
             font-weight: 800; 
             text-transform: uppercase; 
             color: #1f2937;
          }
          
          .back-content {
             flex: 1;
             display: flex;
             flex-direction: column;
             gap: 15px;
             font-size: 12px;
             color: #374151;
          }
          
          .info-group {
             display: flex;
             flex-direction: column;
             gap: 4px;
          }
          .info-label {
             font-size: 10px;
             text-transform: uppercase;
             font-weight: 700;
             color: #6b7280;
          }
          .info-value {
             font-weight: 600;
             color: #111827;
             font-size: 13px;
          }

          .validity-box {
             background: #FEF3C7;
             border: 1px solid #FCD34D;
             padding: 10px;
             border-radius: 8px;
             text-align: center;
             margin-top: 10px;
          }
          .validity-label { font-size: 10px; font-weight: 700; color: #92400E; text-transform: uppercase; }
          .validity-date { font-size: 16px; font-weight: 800; color: #B45309; }

          .back-footer {
             margin-top: 20px;
             text-align: center;
             font-size: 10px;
             color: #9ca3af;
             border-top: 1px solid #e5e7eb;
             padding-top: 10px;
          }

          /* --- PAGE 2: Terms & Conditions --- */
          .terms-page {
             page-break-before: always;
             background: #fff;
             padding: 40px;
             margin-top: 40px; /* Visual separation if single page scroll */
          }
          .terms-title {
             font-size: 20px;
             font-weight: 800;
             color: #138808;
             border-bottom: 3px solid #FF9933;
             padding-bottom: 10px;
             margin-bottom: 20px;
             text-transform: uppercase;
          }
          .term-section { margin-bottom: 25px; }
          .term-header {
             font-size: 14px;
             font-weight: 700;
             color: #1f2937;
             margin-bottom: 10px;
             background: #f3f4f6;
             padding: 5px 10px;
             border-radius: 4px;
             border-left: 4px solid #138808;
          }
          .term-list {
             list-style: none;
             padding-left: 5px;
          }
          .term-list li {
             position: relative;
             padding-left: 20px;
             margin-bottom: 8px;
             font-size: 12px;
             line-height: 1.6;
             color: #4b5563;
          }
          .term-list li::before {
             content: "➤";
             position: absolute;
             left: 0;
             color: #FF9933;
             font-size: 10px;
          }
          
          /* Utility Classes */
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
        </style>
        <!-- QRCode Library -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      </head>
      <body>
        <div class="page-container">
           
           <!-- PAGE 1: FRONT AND BACK -->
           
           <!-- CARD FRONT -->
           <div class="card-shared card-front">
              <div class="card-header">
                 <div class="header-left">
                    <div class="company-name">BHARATPEAK BUSINESS</div>
                    <div class="company-tagline">Hum apke sath</div>
                    ${isPremier ? '<div class="company-sub">PREMIER PARTNER</div>' : ''}
                 </div>
                 <div class="header-right">
                    ${logoBase64 ? `<img src="${logoBase64}" class="logo-img" />` : ''}
                    <div class="card-type-badge">${cardTitle}</div>
                 </div>
              </div>

              <div class="card-body">
                 <div class="bg-watermark">BHARAT PEAK</div>
                 
                 <!-- Row 1: Header Info -->
                 <div class="user-header-info">
                    <div class="user-name">${applicationData.personalDetails.fullName}</div>
                    <div class="user-id">ID: ${applicationData.uniqueCode || 'PENDING'}</div>
                 </div>

                 <!-- Row 2 Col 1: Photo -->
                 <div class="photo-box">
                    ${photoBase64 ? `<img src="${photoBase64}" class="photo" />` : ''}
                 </div>

                 <!-- Row 2 Col 2: Details -->
                 <div class="user-details-list">
                    ${applicationData.personalDetails.mobile ?
            `<div class="detail-item"><span class="detail-label">Mobile</span> <span class="detail-value">${applicationData.personalDetails.mobile}</span></div>` : ''}
                    
                    <div class="detail-item">
                       <span class="detail-label">Aadhaar</span> 
                       <span class="detail-value">${applicationData.personalDetails.aadhaarNumber || 'PENDING'}</span>
                    </div>
                    
                    ${applicationData.personalDetails.city ?
            `<div class="detail-item"><span class="detail-label">City</span> <span class="detail-value">${applicationData.personalDetails.city}</span></div>` : ''}
                 </div>
                 
                 <!-- Row 2 Col 3: QR -->
                 <div class="qr-section">
                    <div id="qrcode"></div>
                 </div>
              </div>
           </div>
           
           <!-- CARD BACK -->
           <div class="card-shared card-back">
              <div class="back-header">
                  <div class="back-company-name">Bharatpeak Business Services Pvt. Ltd.</div>
                  <div style="font-size: 10px; color: #666; margin-top:2px;">"Hum apke sath"</div>
              </div>
              
              <div class="back-content">
                  <div class="info-group">
                      <div class="info-label">Address</div>
                      <div class="info-value">${applicationData.personalDetails.city || 'Head Office'}, ${applicationData.personalDetails.state || 'India'}</div>
                  </div>
                  
                  <div class="info-group">
                      <div class="info-label">Contact Support</div>
                      <div class="info-value">📞 88180 60903</div>
                      <div class="info-value">✉️ support@bharatpeakbusiness.com</div>
                  </div>

                  <div class="info-group">
                      <div class="info-label">Website</div>
                      <div class="info-value">🌐 bharatpeakbusiness.com</div>
                  </div>
                  
                  <div class="validity-box">
                      <div class="validity-label">Valid Upto</div>
                      <div class="validity-date">${formattedExpiry}</div>
                  </div>
              </div>

              <div class="back-footer">
                  This card is property of Bharatpeak Business Services. If found, please return to the address above.
              </div>
           </div>

           <!-- PAGE 2: TERMS & CONDITIONS -->
           <div class="terms-page">
               <div class="terms-title">Terms & Conditions / नियम एवं शर्तें</div>
               
               <div class="term-section">
                   <div class="term-header">ड्यूटी / सुविधाएँ</div>
                   <ul class="term-list">
                      <li>परामर्श का समय सुबह 9:30 से लेकर शाम 5:00 तक होगा।</li>
                      <li>Emergency स्थिति में अपना हेल्थ कार्ड कोई मदद नहीं कर सकता।</li>
                      <li>दवाइयों एवं जाँच पर छूट की सुविधा उपलब्ध होगी, जहाँ हमारे पार्टनर जुड़े होंगे। उदाहरण: Ultrasound, MRI, CT Scan, Labs.</li>
                      <li>दवाइयों में वही छूट मिलेगी जहां हमारे पार्टनर होंगे। अन्यथा CT Scan, Ultrasound, MRI आप पूछ कर कही भी करवा सकते हो, डॉक्टर की स्लिप भेजने के बाद।</li>
                   </ul>
               </div>

               <div class="term-section">
                   <div class="term-header">नियम एवं शर्तें</div>
                   <ul class="term-list">
                      <li>बिना कारण यदि आप कोई सर्विस लेते हैं, तो उस पर मिलने वाले डिस्काउंट के लिए हम जिम्मेदार नहीं होंगे।</li>
                      <li>अगर आपके इलाके में पार्टनर नहीं होंगे, तो हम डिस्काउंट के लिए जिम्मेदार नहीं होंगे।</li>
                      <li>इस कार्ड की वैधता: ${validityPeriod} (Free: 3 महीने, Premier: 1 साल)। इसके बाद रिनिवल करवा सकते हैं।</li>
                   </ul>
               </div>
               
               <div class="term-section">
                   <div class="term-header">अपना हेल्थ कार्ड से जुड़ी जानकारी</div>
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

        <script>
           // Generate QR Code
           try {
              new QRCode(document.getElementById("qrcode"), {
                 text: "${applicationData.uniqueCode || 'PENDING'}",
                 width: 80,
                 height: 80,
                 colorDark : "#000000",
                 colorLight : "#ffffff",
                 correctLevel : QRCode.CorrectLevel.M
              });
           } catch (e) {
              console.error('QR Gen Failed', e);
              document.getElementById("qrcode").innerHTML = "QR";
           }
        </script>
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

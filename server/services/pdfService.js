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

      // Digital Identity Card Template (Ref: Aadhaar Style)
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
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', 'Noto Sans Devanagari', sans-serif; 
            background: #fff;
            padding: 40px;
            -webkit-print-color-adjust: exact;
          }
          .page-container {
             max-width: 800px;
             margin: 0 auto;
          }
          
          /* --- CARD COMMON STYLES --- */
          .card-shared {
             width: 100%;
             max-width: 480px; /* Compact ID width */
             margin: 0 auto 30px;
             border-radius: 12px;
             overflow: hidden;
             box-shadow: 0 4px 15px rgba(0,0,0,0.1);
             position: relative;
             border: 1px solid rgba(0,0,0,0.1);
          }

          /* --- FRONT SIDE --- */
          .card-front {
             background: linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 50%, #F0FDF4 100%); /* Subtle Orange-White-Green Tint */
             border: 1px solid #FF9933;
             min-height: 280px;
             display: flex;
             flex-direction: column;
          }

          /* Top Strip */
          .front-header {
             display: flex;
             justify-content: space-between;
             align-items: center;
             padding: 10px 20px;
             border-bottom: 2px solid #FF9933; /* Orange Line */
             background: rgba(255,255,255,0.8);
          }
          .header-branding {
             display: flex;
             align-items: center;
             gap: 10px;
          }
          .header-logo { height: 35px; width: auto; }
          .header-text { display: flex; flex-direction: column; }
          .org-name {
             font-size: 16px;
             font-weight: 900;
             color: #000;
             text-transform: uppercase;
             line-height: 1;
          }
          .org-sub {
             font-size: 9px;
             font-weight: 700;
             color: #B45309;
             text-transform: uppercase;
             letter-spacing: 0.5px;
             margin-top: 2px;
          }
          .header-right-badge {
             font-size: 9px;
             font-weight: 800;
             text-transform: uppercase;
             background: linear-gradient(90deg, #EA580C, #15803d);
             color: white;
             padding: 3px 10px;
             border-radius: 12px;
             box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }

          /* Main Body - Flex Row */
          .front-body {
             flex: 1;
             display: flex;
             padding: 15px 20px;
             gap: 15px;
             align-items: center; /* Center vertically */
             position: relative;
          }
           
          /* Watermark */
          .bg-watermark {
             position: absolute;
             top: 50%;
             left: 50%;
             transform: translate(-50%, -50%) rotate(-20deg);
             font-size: 50px;
             font-weight: 900;
             color: rgba(0,0,0,0.03);
             pointer-events: none;
             white-space: nowrap;
             z-index: 0;
          }

          /* Col 1: Photo */
          .f-photo {
             width: 90px;
             height: 110px;
             border-radius: 6px;
             border: 2px solid #333;
             overflow: hidden;
             box-shadow: 0 2px 4px rgba(0,0,0,0.1);
             z-index: 1;
             flex-shrink: 0;
          }
          .f-photo img { width: 100%; height: 100%; object-fit: cover; }

          /* Col 2: Details (Beside Photo) */
          .f-details {
             flex: 1;
             display: flex;
             flex-direction: column;
             justify-content: center;
             z-index: 1;
          }
          .f-name {
             font-size: 18px;
             font-weight: 800;
             color: #000;
             text-transform: uppercase;
             margin-bottom: 2px;
             line-height: 1.2;
          }
          .f-id {
             font-size: 13px;
             font-weight: 700;
             color: #15803d; /* Green ID */
             margin-bottom: 8px;
             font-family: monospace;
          }
          
          .f-info-row {
             font-size: 11px;
             margin-bottom: 3px;
             color: #1f2937;
             display: flex;
             align-items: baseline;
          }
          .f-label {
             font-weight: 700;
             width: 55px;
             color: #555;
             font-size: 10px;
             text-transform: uppercase;
          }
          .f-val { font-weight: 600; color: #000; }

          /* Col 3: QR (Right) */
          .f-qr {
             width: 85px;
             height: 85px;
             background: #fff;
             padding: 4px;
             border: 1px solid #ddd;
             flex-shrink: 0;
             display: flex;
             justify-content: center;
             align-items: center;
             z-index: 1;
          }

          /* Bottom Strip (Red Line style -> Green/Orange) */
          .front-footer {
             border-top: 2px solid #138808; /* Green Line */
             background: #fdfdfd;
             padding: 8px 0;
             text-align: center;
          }
          .footer-tagline {
             font-size: 14px;
             font-weight: 700;
             color: #000;
             font-style: italic;
             margin-bottom: 2px;
          }
          .footer-sub {
             font-size: 10px;
             color: #666;
          }


          /* --- BACK SIDE --- */
          .card-back {
             background: #fff;
             border: 1px solid #eaebed;
             min-height: 280px;
             display: flex;
             flex-direction: column;
             justify-content: space-between;
             padding: 24px;
             position: relative;
          }
          /* Strip on Back */
          .back-top-strip {
             position: absolute;
             top: 20px;
             left: 0;
             width: 100%;
             height: 4px;
             background: linear-gradient(90deg, #FF9933, #FFFFFF, #138808);
          }

          .back-header {
             text-align: center;
             margin-top: 10px;
             margin-bottom: 20px;
          }
          .back-org {
             font-size: 15px;
             font-weight: 800;
             text-transform: uppercase;
             color: #111;
             border-bottom: 1px solid #eee;
             padding-bottom: 8px;
             display: inline-block;
          }
          
          .back-content {
             flex: 1;
             display: flex;
             flex-direction: column;
             gap: 12px;
          }
          .b-row {
             display: flex;
             flex-direction: column;
             gap: 2px;
          }
          .b-label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #888; }
          .b-val { font-size: 12px; font-weight: 600; color: #000; }

          .validity-block {
             background: #FFFbea;
             border: 1px dashed #FCD34D;
             padding: 8px;
             text-align: center;
             margin-top: 10px;
             border-radius: 6px;
          }
          .v-label { font-size: 9px; font-weight: 700; color: #92400E; text-transform: uppercase; }
          .v-date { font-size: 14px; font-weight: 800; color: #B45309; }

          .back-footer-text {
             text-align: center;
             font-size: 9px;
             color: #999;
             margin-top: 15px;
          }

          /* --- PAGE 2 Terms --- */
          .terms-page {
             page-break-before: always;
             background: #fff;
             padding: 40px;
          }
          .terms-title {
             font-size: 18px;
             font-weight: 800;
             color: #138808;
             border-bottom: 2px solid #FF9933;
             padding-bottom: 8px;
             margin-bottom: 20px;
          }
          .t-group { margin-bottom: 20px; }
          .t-head {
             font-size: 13px; font-weight: 700; color: #000; margin-bottom: 8px;
             background: #f3f4f6; padding: 4px 8px; border-left: 3px solid #FF9933;
          }
          .t-list { list-style: none; padding-left: 5px; }
          .t-list li {
             position: relative; padding-left: 15px; margin-bottom: 6px;
             font-size: 11px; line-height: 1.5; color: #444;
          }
          .t-list li::before {
             content: "▪"; position: absolute; left: 0; color: #138808;
          }

        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      </head>
      <body>
        <div class="page-container">
           
           <!-- FRONT CARD -->
           <div class="card-shared card-front">
              <!-- Header -->
              <div class="front-header">
                  <div class="header-branding">
                      ${logoBase64 ? `<img src="${logoBase64}" class="header-logo" />` : ''}
                      <div class="header-text">
                          <div class="org-name">BHARATPEAK BUSINESS</div>
                          <div class="org-sub">Business Auxiliary Services</div>
                      </div>
                  </div>
                  <div class="header-right-badge">${cardTitle}</div>
              </div>

              <!-- Body: Photo | Details | QR -->
              <div class="front-body">
                  <div class="bg-watermark">BHARAT PEAK</div>
                  
                  <div class="f-photo">
                      ${photoBase64 ? `<img src="${photoBase64}" />` : ''}
                  </div>

                  <div class="f-details">
                      <div class="f-name">${applicationData.personalDetails.fullName}</div>
                      <div class="f-id">ID: ${applicationData.uniqueCode || 'PENDING'}</div>
                      
                      <div class="f-info-row">
                          <span class="f-label">Mobile</span>
                          <span class="f-val">${applicationData.personalDetails.mobile}</span>
                      </div>
                      <div class="f-info-row">
                          <span class="f-label">Aadhaar</span>
                          <span class="f-val">${applicationData.personalDetails.aadhaarNumber || 'PENDING'}</span>
                      </div>
                      <div class="f-info-row">
                          <span class="f-label">City</span>
                          <span class="f-val">${applicationData.personalDetails.city}</span>
                      </div>
                  </div>

                  <div class="f-qr">
                      <div id="qrcode"></div>
                  </div>
              </div>

              <!-- Footer Strip -->
              <div class="front-footer">
                  <div class="footer-tagline">“ Hum apke sath ”</div>
                  <div class="footer-sub">support@bharatpeakbusiness.com</div>
              </div>
           </div>

           <!-- BACK CARD -->
           <div class="card-shared card-back">
              <div class="back-top-strip"></div>
              
              <div class="back-header">
                  <div class="back-org">Bharatpeak Business Services Pvt. Ltd.</div>
              </div>

              <div class="back-content">
                  <div class="b-row">
                      <div class="b-label">Registered Office</div>
                      <div class="b-val">${applicationData.personalDetails.city || 'Head Office'}, ${applicationData.personalDetails.state || 'India'}</div>
                  </div>

                  <div class="b-row">
                      <div class="b-label">Customer Care</div>
                      <div class="b-val">88180 60903</div>
                  </div>
                  
                  <div class="b-row">
                      <div class="b-label">Email & Website</div>
                      <div class="b-val">support@bharatpeakbusiness.com</div>
                      <div class="b-val">bharatpeakbusiness.com</div>
                  </div>

                  <div class="validity-block">
                      <div class="v-label">Valid Upto</div>
                      <div class="v-date">${formattedExpiry}</div>
                  </div>
              </div>

              <div class="back-footer-text">
                  If found, please return to the address above.
              </div>
           </div>

           <!-- TERMS PAGE -->
           <div class="terms-page">
               <div class="terms-title">Terms & Conditions / नियम एवं शर्तें</div>
               
               <div class="t-group">
                   <div class="t-head">ड्यूटी / सुविधाएँ</div>
                   <ul class="t-list">
                      <li>परामर्श का समय सुबह 9:30 से लेकर शाम 5:00 तक होगा।</li>
                      <li>Emergency स्थिति में अपना हेल्थ कार्ड कोई मदद नहीं कर सकता।</li>
                      <li>दवाइयों एवं जाँच पर छूट की सुविधा उपलब्ध होगी, जहाँ हमारे पार्टनर जुड़े होंगे। उदाहरण: Ultrasound, MRI, CT Scan, Labs.</li>
                      <li>दवाइयों में वही छूट मिलेगी जहां हमारे पार्टनर होंगे। अन्यथा CT Scan, Ultrasound, MRI आप पूछ कर कही भी करवा सकते हो, डॉक्टर की स्लिप भेजने के बाद।</li>
                   </ul>
               </div>

               <div class="t-group">
                   <div class="t-head">नियम एवं शर्तें</div>
                   <ul class="t-list">
                      <li>बिना कारण यदि आप कोई सर्विस लेते हैं, तो उस पर मिलने वाले डिस्काउंट के लिए हम जिम्मेदार नहीं होंगे।</li>
                      <li>अगर आपके इलाके में पार्टनर नहीं होंगे, तो हम डिस्काउंट के लिए जिम्मेदार नहीं होंगे।</li>
                      <li>इस कार्ड की वैधता: ${validityPeriod} (Free: 3 महीने, Premier: 1 साल)। इसके बाद रिनिवल करवा सकते हैं।</li>
                   </ul>
               </div>

               <div class="t-group">
                   <div class="t-head">स्वास्थ्य कार्ड जानकारी</div>
                   <ul class="t-list">
                      <li>अपना हेल्थ कार्ड के माध्यम से आप अपने और अपने परिवार में होने वाली बीमारियों के खर्चे से बच सकते हैं।</li>
                      <li>इस कार्ड के माध्यम से आप अपने क्षेत्र में उपलब्ध OPD, MRI, X-Ray, जाँच और दवाइयों पर होने वाले खर्चे से बच सकते हैं।</li>
                      <li>अगर आपके पास यह कार्ड होगा, तो आप अपने आस-पास के OPD / हॉस्पिटल / क्लिनिक में इलाज करा पाएँगे, जहाँ हमारे पार्टनर हॉस्पिटल जुड़े होंगे।</li>
                   </ul>
               </div>
           </div>

        </div>

        <script>
           try {
              new QRCode(document.getElementById("qrcode"), {
                 text: "${applicationData.uniqueCode || 'PENDING'}",
                 width: 75,
                 height: 75, // Smaller to fit
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

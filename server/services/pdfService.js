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
      const aadhaarBase64 = applicationData.documents.aadhaarPath
         ? `data:image/png;base64,${fs.readFileSync(applicationData.documents.aadhaarPath).toString('base64')}`
         : '';
      const panBase64 = applicationData.documents.panPath
         ? `data:image/png;base64,${fs.readFileSync(applicationData.documents.panPath).toString('base64')}`
         : '';

      // Digital Identity Card Template (Gold Card Style)
      const isPremier = applicationData.applicationType === 'Premier' || applicationData.applicationType === 'Premium';
      const validityPeriod = isPremier ? '1 Year' : '3 Months';
      const cardTitle = isPremier ? 'Premier Card' : 'Free Card'; // Kept logic, but display will be GOLD CARD style

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Inter', 'Noto Sans Devanagari', sans-serif; 
            background: #fff;
            padding: 20px;
            -webkit-print-color-adjust: exact;
          }
          .page-container {
             max-width: 800px;
             margin: 0 auto;
          }
          
          /* GOLD CARD DESIGN */
          .id-card-wrapper {
             width: 100%;
             max-width: 600px;
             margin: 0 auto;
             background: linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%);
             border-radius: 16px;
             overflow: hidden;
             box-shadow: 0 4px 15px rgba(0,0,0,0.1);
             position: relative;
             margin-bottom: 20px;
             border: 2px solid #D97706;
          }

          /* Header Section */
          .card-header {
             display: flex;
             justify-content: space-between;
             align-items: flex-start;
             padding: 16px 24px;
             background: rgba(255,255,255,0.15);
             border-bottom: 1px solid rgba(255,255,255,0.3);
          }
          .header-left {
             display: flex;
             flex-direction: column;
          }
          .company-name {
             font-size: 24px;
             font-weight: 900;
             color: #000;
             text-transform: uppercase;
             line-height: 1.1;
             margin-bottom: 2px;
          }
          .company-tagline {
             font-size: 12px;
             font-weight: 600;
             color: #333;
          }
          .company-sub {
             font-size: 10px;
             font-weight: 700;
             color: #fff;
             margin-top: 4px;
             padding: 2px 6px;
             background: #B45309;
             display: inline-block;
             width: fit-content;
             border-radius: 4px;
          }
          
          .header-right {
             display: flex;
             flex-direction: column;
             align-items: flex-end;
          }
          .logo-img {
             height: 50px;
             width: auto;
             margin-bottom: 4px;
             filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
          }
          
          .card-type-badge {
             font-family: 'Courier New', monospace;
             font-size: 14px;
             font-weight: 800;
             color: #92400E;
             border: 2px solid #92400E;
             padding: 2px 10px;
             border-radius: 20px;
             background: rgba(255,255,255,0.4);
             text-transform: uppercase;
          }

          /* Main Body */
          .card-body {
             padding: 15px 24px 20px;
             display: flex;
             justify-content: space-between;
             align-items: flex-start;
             min-height: 180px;
             position: relative;
          }
          
          .user-main-info {
             flex: 1;
             padding-right: 10px;
             z-index: 2;
          }
          .user-name {
             font-size: 28px;
             font-weight: 800;
             color: #000;
             text-transform: uppercase;
             margin-bottom: 4px;
             line-height: 1;
          }
          .user-id {
             font-size: 22px;
             font-weight: 700;
             color: #000;
             margin-bottom: 12px;
             letter-spacing: 0.5px;
          }

          .photo-box {
             width: 80px;
             height: 100px;
             border-radius: 8px;
             border: 2px solid #D97706;
             overflow: hidden;
             margin-bottom: 10px;
             background: #fff;
             box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          }
          .photo {
             width: 100%;
             height: 100%;
             object-fit: cover;
          }

          .user-details-list {
             font-size: 13px;
             font-weight: 600;
             color: #1F2937;
             line-height: 1.4;
          }

          .qr-section {
             width: 110px;
             text-align: right;
             display: flex;
             flex-direction: column;
             align-items: center;
             background: #fff;
             padding: 8px;
             border-radius: 8px;
             box-shadow: 0 4px 6px rgba(0,0,0,0.1);
             z-index: 2;
          }
          
          /* Footer strip on card */
          .card-footer-strip {
             background: rgba(255,255,255,0.4);
             padding: 10px 24px;
             display: flex;
             justify-content: space-between;
             align-items: center;
             font-weight: 700;
             font-size: 12px;
             color: #000;
             border-top: 1px solid rgba(0,0,0,0.1);
          }
          .expiry-text {
             font-size: 13px;
          }

          /* T&C Section */
          .terms-container {
             width: 100%;
             max-width: 600px;
             margin: 0 auto;
             background: #FEF3C7; /* Light yellow to match theme */
             border-radius: 12px;
             padding: 20px;
             font-family: 'Noto Sans Devanagari', sans-serif;
             font-size: 11px;
             color: #333;
             line-height: 1.5;
             border: 1px solid #FCD34D;
          }
          
          .term-list {
             list-style: none;
             margin-bottom: 15px;
          }
          .term-list li {
             position: relative;
             padding-left: 14px;
             margin-bottom: 5px;
          }
          .term-list li::before {
             content: "•";
             position: absolute;
             left: 0;
             color: #D97706; /* Dark gold */
             font-weight: bold;
             font-size: 14px;
          }
          .term-header {
             font-size: 13px;
             font-weight: 700;
             color: #92400E;
             margin-bottom: 8px;
             text-transform: uppercase;
             border-bottom: 1px solid #FDE68A;
             padding-bottom: 4px;
          }

          .brand-footer {
             text-align: center;
             font-size: 10px;
             color: #9ca3af;
             margin-top: 15px;
          }

          /* Watermark Effect */
          .bg-watermark {
             position: absolute;
             top: 50%;
             left: 50%;
             transform: translate(-50%, -50%) rotate(-30deg);
             font-size: 80px;
             font-weight: 900;
             color: rgba(255,255,255,0.15);
             pointer-events: none;
             white-space: nowrap;
             z-index: 1;
          }
        </style>
        <!-- QRCode Library -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      </head>
      <body>
        <div class="page-container">
           <!-- GOLD CARD -->
           <div class="id-card-wrapper">
              <div class="card-header">
                 <div class="header-left">
                    <div class="company-name">BHARAT PEAK</div>
                    <div class="company-tagline">Business Auxiliary Services</div>
                    ${isPremier ? '<div class="company-sub">PREMIER PARTNER</div>' : ''}
                 </div>
                 <div class="header-right">
                    ${logoBase64 ? `<img src="${logoBase64}" class="logo-img" />` : ''}
                    <div class="card-type-badge">${cardTitle}</div>
                 </div>
              </div>

              <div class="card-body">
                 <div class="bg-watermark">BHARAT PEAK</div>
                 
                 <div class="user-main-info">
                    <div class="user-name">${applicationData.personalDetails.fullName}</div>
                    <div class="user-id">${applicationData.uniqueCode || 'PENDING'}</div>
                    
                    ${photoBase64 ? `<div class="photo-box"><img src="${photoBase64}" class="photo" /></div>` : ''}

                    <div class="user-details-list">
                       ${applicationData.personalDetails.mobile ? `<div>Mobile: ${applicationData.personalDetails.mobile}</div>` : ''}
                       ${applicationData.personalDetails.aadhaarNumber ? `<div>Aadhaar: ${applicationData.personalDetails.aadhaarNumber}</div>` : ''}
                       ${applicationData.personalDetails.city ? `<div>City: ${applicationData.personalDetails.city}</div>` : ''}
                    </div>
                 </div>
                 
                 <div class="qr-section">
                    <div id="qrcode"></div>
                 </div>
              </div>

              <div class="card-footer-strip">
                 <div>Book Your Appointment: ${applicationData.personalDetails.mobile || 'support@bharatpeak.com'}</div>
                 <div class="expiry-text">Expire Date: ${isPremier ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-GB') : new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString('en-GB')}</div>
              </div>
           </div>

           <!-- T&C SECTION -->
           <div class="terms-container">
              
              <div class="term-list">
                  <div class="term-header">ड्यूटी / सुविधाएँ</div>
                  <ul class="term-list">
                     <li>परामर्श का समय सुबह 9:30 से लेकर शाम 5:00 तक होगा।</li>
                     <li>Emergency स्थिति में अपना हेल्थ कार्ड कोई मदद नहीं कर सकता।</li>
                     <li>दवाइयों एवं जाँच पर छूट की सुविधा उपलब्ध होगी, जहाँ हमारे पार्टनर जुड़े होंगे। उदाहरण: Ultrasound, MRI, CT Scan, Labs.</li>
                     <li>दवाइयों में वही छूट मिलेगी जहां हमारे पार्टनर होंगे। अन्यथा CT Scan, Ultrasound, MRI आप पूछ कर कही भी करवा सकते हो, डॉक्टर की स्लिप भेजने के बाद।</li>
                  </ul>
              </div>

              <div class="term-list">
                  <div class="term-header">नियम एवं शर्तें (Terms & Conditions)</div>
                  <ul class="term-list">
                     <li>बिना कारण यदि आप कोई सर्विस लेते हैं, तो उस पर मिलने वाले डिस्काउंट के लिए हम जिम्मेदार नहीं होंगे।</li>
                     <li>अगर आपके इलाके में पार्टनर नहीं होंगे, तो हम डिस्काउंट के लिए जिम्मेदार नहीं होंगे।</li>
                     <li>इस कार्ड की वैधता: ${validityPeriod} (Free: 3 महीने, Premier: 1 साल)। इसके बाद रिनिवल करवा सकते हैं।</li>
                  </ul>
              </div>
              
              <div class="term-list">
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

           <div class="brand-footer">
              This is a Digital Health Identity Card issued by Bharat Peak Business. • support@bharatpeak.com
           </div>
        </div>

        <script>
           // Generate QR Code
           try {
              new QRCode(document.getElementById("qrcode"), {
                 text: "${applicationData.uniqueCode || 'PENDING'}",
                 width: 94,
                 height: 94,
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

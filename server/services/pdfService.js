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
      const logoSvgPath = path.join(__dirname, '../../public/logo.svg');
      const logoPngPath = path.join(__dirname, '../../public/logo.png');

      let logoBase64 = '';
      if (fs.existsSync(logoSvgPath)) {
         logoBase64 = `data:image/svg+xml;base64,${fs.readFileSync(logoSvgPath).toString('base64')}`;
      } else if (fs.existsSync(logoPngPath)) {
         logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPngPath).toString('base64')}`;
      }

      // Handle PDF photo upload edge case gracefully
      let photoBase64 = '';
      let isPdfPhoto = false;
      if (applicationData.documents.photoPath) {
         if (applicationData.documents.photoPath.toLowerCase().endsWith('.pdf')) {
            isPdfPhoto = true;
            // We can embed it as object for the PDF render
            photoBase64 = `data:application/pdf;base64,${fs.readFileSync(applicationData.documents.photoPath).toString('base64')}`;
         } else {
            photoBase64 = `data:image/png;base64,${fs.readFileSync(applicationData.documents.photoPath).toString('base64')}`;
         }
      }

      const isPremier = applicationData.applicationType === 'Premier' || applicationData.applicationType === 'Premium';
      const validityPeriod = isPremier ? '1 Year' : '3 Months';
      const cardTitle = isPremier ? 'PREMIER' : 'FREE';

      const expiryDate = isPremier
         ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
         : new Date(new Date().setMonth(new Date().getMonth() + 3));
      const formattedExpiry = `EXP DATE : ${expiryDate.toLocaleDateString('en-GB')}`;

      const panNumber = applicationData.personalDetails.panNumber || '';
      const employeeName = applicationData.personalDetails.employeeName || '';
      const pinCode = applicationData.personalDetails.pinCode || '';
      const bankName = applicationData.personalDetails.bankName || '';
      const ifscCode = applicationData.personalDetails.ifscCode || '';
      const accountNumber = applicationData.personalDetails.accountNumber || '';

      // Address from Aadhaar back OCR
      const address = applicationData.personalDetails.address || '';

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
            padding: 30px;
            -webkit-print-color-adjust: exact;
          }
          .page-container {
             max-width: 800px;
             margin: 0 auto;
             display: flex;
             flex-direction: column;
             align-items: center;
             gap: 25px;
          }
          
          /* ATM CARD: 85.6mm x 53.98mm ≈ 3.37" x 2.125" */
          .card {
             width: 85.6mm;
             height: 53.98mm;
             border-radius: 3.175mm;
             overflow: hidden;
             position: relative;
             box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          }

          /* ===== FRONT CARD: FREE (India tricolor) ===== */
          .card-front {
             background: linear-gradient(135deg, #FF9933 0%, #FFFFFF 40%, #FFFFFF 60%, #138808 100%);
             border: 1.5px solid #eab308;
             display: flex;
             flex-direction: column;
          }

          /* ===== FRONT CARD: PREMIER (ultra-premium dark gold) ===== */
          .card-front.premier {
             background: linear-gradient(145deg, #0a0818 0%, #130f2e 30%, #1c1535 60%, #0d1a22 100%);
             border: 1.5px solid #c9a84c;
             position: relative;
          }
          /* Radial gold shimmer */
          .card-front.premier::before {
             content: '';
             position: absolute;
             inset: 0;
             background: 
               radial-gradient(ellipse at 80% 20%, rgba(212,175,55,0.25) 0%, transparent 55%),
               radial-gradient(ellipse at 20% 80%, rgba(184,134,11,0.15) 0%, transparent 50%),
               linear-gradient(135deg, rgba(201,168,76,0.12) 0%, transparent 40%, rgba(201,168,76,0.08) 100%);
             pointer-events: none;
             z-index: 0;
          }
          /* Gold shimmer line across top */
          .card-front.premier::after {
             content: '';
             position: absolute;
             top: 0; left: 0; right: 0;
             height: 2px;
             background: linear-gradient(90deg, transparent 0%, #d4af37 20%, #ffd700 50%, #d4af37 80%, transparent 100%);
             z-index: 1;
          }
          .card-front.premier > * { position: relative; z-index: 2; }

          /* Front: Top Bar */
          .f-top {
             padding: 8px 12px 4px;
             display: flex;
             justify-content: space-between;
             align-items: flex-start;
             position: relative;
          }
          .f-brand {
             display: flex;
             flex-direction: column;
          }
          .f-brand-row {
             display: flex;
             align-items: center;
             gap: 5px;
          }
          .f-logo { height: 18px; width: auto; }
          .f-company {
             font-size: 11px;
             font-weight: 900;
             color: #000;
             text-transform: uppercase;
             letter-spacing: -0.3px;
          }
          .premier .f-company { 
             color: #f5d77e; 
             text-shadow: 0 0 8px rgba(255,215,0,0.3);
             letter-spacing: 0.2px;
          }
          .f-tagline {
             font-size: 8px;
             font-weight: 700;
             color: #1f2937;
             font-style: italic;
             margin-top: -1px;
             padding-left: 23px;
          }
          .premier .f-tagline { color: #c8a84b; opacity: 0.85; }
          .f-badge {
             font-size: 7px;
             font-weight: 900;
             text-transform: uppercase;
             background: linear-gradient(90deg, #ea580c, #16a34a);
             color: white;
             padding: 2px 8px;
             border-radius: 10px;
             box-shadow: 0 2px 6px rgba(0,0,0,0.2);
             border: 1px solid #fff;
             letter-spacing: 0.3px;
          }
          .premier .f-badge {
             background: linear-gradient(135deg, #8b6914 0%, #d4af37 40%, #ffd700 60%, #c8a84b 100%);
             color: #0a0818;
             border: 1px solid rgba(255,215,0,0.6);
             box-shadow: 0 0 10px rgba(212,175,55,0.5), inset 0 1px 0 rgba(255,255,255,0.3);
             font-weight: 900;
             letter-spacing: 0.5px;
          }

          /* Front: Middle Row */
          .f-middle {
             flex: 1;
             display: flex;
             align-items: center;
             padding: 4px 12px;
             gap: 8px;
          }
          .f-photo {
             width: 55px;
             height: 65px;
             border-radius: 4px;
             border: 1.5px solid #333;
             overflow: hidden;
             flex-shrink: 0;
             background: #e5e7eb;
             display: flex;
             align-items: center;
             justify-content: center;
             font-size: 7px;
             color: #888;
             text-align: center;
          }
          .premier .f-photo {
             border: 1.5px solid #d4af37;
             box-shadow: 0 0 8px rgba(212,175,55,0.4), inset 0 0 3px rgba(212,175,55,0.1);
          }
          .f-photo img { width: 100%; height: 100%; object-fit: cover; }
          .f-photo object { width: 100%; height: 100%; }
          
          .f-info {
             flex: 1;
             display: flex;
             flex-direction: column;
             justify-content: center;
          }
          .f-name {
             font-size: 12px;
             font-weight: 800;
             color: #000;
             text-transform: uppercase;
             line-height: 1.2;
             margin-bottom: 3px;
          }
          .premier .f-name { 
             color: #f5d77e; 
             text-shadow: 0 0 12px rgba(245,215,126,0.4);
             font-size: 11.5px;
          }
          .f-detail-row {
             font-size: 9px;
             margin-top: 2px;
             display: flex;
             gap: 4px;
          }
          .f-label {
             font-weight: 600;
             color: #374151;
          }
          .premier .f-label { color: #c8a84b; }
          .f-val {
             font-weight: 700;
             color: #000;
          }
          .premier .f-val { color: #f0e6cc; }

          .f-qr {
             width: 52px;
             height: 52px;
             background: #fff;
             padding: 2px;
             border: 1px solid #ddd;
             border-radius: 4px;
             flex-shrink: 0;
             display: flex;
             justify-content: center;
             align-items: center;
          }
          .premier .f-qr {
             border: 1px solid rgba(212,175,55,0.5);
             box-shadow: 0 0 6px rgba(212,175,55,0.2);
          }

          /* Front: Bottom ID Bar */
          .f-bottom {
             background: rgba(0,0,0,0.05);
             border-top: 1px solid rgba(0,0,0,0.08);
             padding: 4px 12px;
             text-align: center;
          }
          .premier .f-bottom {
             background: linear-gradient(90deg, rgba(184,134,11,0.2) 0%, rgba(212,175,55,0.25) 50%, rgba(184,134,11,0.2) 100%);
             border-top: 1px solid rgba(212,175,55,0.4);
          }
          .f-id {
             font-size: 11px;
             font-weight: 800;
             color: #15803d;
             letter-spacing: 1px;
             font-family: monospace;
          }
          .premier .f-id { 
             color: #ffd700; 
             text-shadow: 0 0 8px rgba(255,215,0,0.5);
             letter-spacing: 1.5px;
          }

          /* ===== BACK CARD ===== */
          .card-back {
             background: #fff;
             border: 1px solid #e5e7eb;
             display: flex;
             flex-direction: column;
          }
          .card-back.premier {
             background: linear-gradient(160deg, #0a0818 0%, #130f2e 50%, #1c1535 100%);
             border: 1px solid #c9a84c;
             position: relative;
          }
          .card-back.premier::before {
             content: '';
             position: absolute;
             inset: 0;
             background: radial-gradient(ellipse at 30% 60%, rgba(184,134,11,0.12) 0%, transparent 60%);
             pointer-events: none;
          }
          .card-back.premier > * { position: relative; z-index: 1; }
          .premier .b-company { color: #f5d77e; text-shadow: 0 0 8px rgba(255,215,0,0.3); }
          .premier .b-addr-label { color: #c8a84b; }
          .premier .b-addr-text { color: #e5e7eb; }
          .premier .b-foot-item { color: #c8a84b; }
          .premier .b-validity { background: rgba(184,134,11,0.2); color: #ffd700; border-color: rgba(212,175,55,0.5); }
          .premier .b-footer { background: rgba(0,0,0,0.4); border-top-color: rgba(212,175,55,0.3); }

          /* Back: Top tri-color strip */
          .b-strip {
             height: 3px;
             background: linear-gradient(90deg, #FF9933 33%, #FFFFFF 33%, #FFFFFF 66%, #138808 66%);
          }
          .premier .b-strip {
             background: linear-gradient(90deg, transparent 0%, #d4af37 20%, #ffd700 50%, #d4af37 80%, transparent 100%);
             height: 2px;
          }

          .b-company {
             text-align: center;
             font-size: 10px;
             font-weight: 800;
             color: #1f2937;
             margin-top: 6px;
             letter-spacing: 0.5px;
          }

          /* Back: Address area */
          .b-address-area {
             flex: 1;
             padding: 6px 14px;
             display: flex;
             flex-direction: column;
             justify-content: center;
          }
          .b-addr-label {
             font-size: 7px;
             font-weight: 700;
             text-transform: uppercase;
             color: #9ca3af;
             margin-bottom: 4px;
          }
          .b-addr-text {
             font-size: 9px;
             font-weight: 500;
             color: #1f2937;
             line-height: 1.5;
          }

          /* Back: Footer container spacing */
          .b-footer-container {
             display: flex;
             flex-direction: column;
             margin-top: auto;
          }
          .b-validity-wrapper {
             padding-left: 10px;
             margin-bottom: 4px;
          }
          .b-validity {
             font-size: 7px;
             font-weight: 800;
             color: #B45309;
             background: #FEF3C7;
             padding: 2px 6px;
             border-radius: 4px;
             border: 1px solid #FCD34D;
             display: inline-block;
          }
          
          /* Back: Footer bar */
          .b-footer {
             border-top: 1px solid #e5e7eb;
             background: #f9fafb;
             padding: 5px 10px;
             display: flex;
             justify-content: flex-end;
             align-items: center;
             gap: 8px;
          }
          .b-foot-item {
             display: flex;
             align-items: center;
             gap: 3px;
             font-size: 6px;
             color: #6b7280;
             font-weight: 600;
          }
          .b-foot-icon {
             font-size: 8px;
          }

          /* ===== PAGE 2: Terms ===== */
          .terms-page {
             page-break-before: always;
             width: 100%;
             max-width: 600px;
             margin: 40px auto 0;
             padding: 30px;
          }
          .terms-title {
             font-size: 16px;
             font-weight: 800;
             color: #138808;
             border-bottom: 2px solid #FF9933;
             padding-bottom: 8px;
             margin-bottom: 15px;
          }
          .t-group { margin-bottom: 18px; }
          .t-head {
             font-size: 12px; font-weight: 700; color: #000; margin-bottom: 6px;
             background: #f3f4f6; padding: 3px 8px; border-left: 3px solid #FF9933;
          }
          .t-list { list-style: none; padding-left: 5px; }
          .t-list li {
             position: relative; padding-left: 14px; margin-bottom: 5px;
             font-size: 10px; line-height: 1.5; color: #444;
          }
          .t-list li::before {
             content: "▪"; position: absolute; left: 0; color: #138808;
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
      </head>
      <body>
        <div class="page-container">
           
           <!-- FRONT -->
           <div class="card card-front ${isPremier ? 'premier' : ''}">
              <div class="f-top">
                  <div class="f-brand">
                      <div class="f-brand-row">
                          ${logoBase64 ? `<img src="${logoBase64}" class="f-logo" />` : ''}
                          <span class="f-company">Bharatpeak Business</span>
                      </div>
                      <div class="f-tagline">Services — हम आपके साथ</div>
                  </div>
                  <div class="f-badge">${cardTitle}</div>
              </div>

              <div class="f-middle">
                  <div class="f-photo">
                      ${photoBase64 ?
            isPdfPhoto ? `<object data="${photoBase64}" type="application/pdf">PDF</object>`
               : `<img src="${photoBase64}" />`
            : '<span style="font-size:7px;color:#888;">No Photo</span>'}
                  </div>
                  <div class="f-info">
                      <div class="f-name">${applicationData.personalDetails.fullName}</div>
                      ${employeeName ? `<div class="f-detail-row"><span class="f-label">Emp:</span> <span class="f-val">${employeeName}</span></div>` : ''}
                      <div class="f-detail-row"><span class="f-label">DOB:</span> <span class="f-val">${applicationData.personalDetails.dob || 'N/A'}</span></div>
                      <div class="f-detail-row"><span class="f-label">Mobile:</span> <span class="f-val">${applicationData.personalDetails.mobile || '-'}</span></div>
                      ${panNumber ? `<div class="f-detail-row"><span class="f-label">PAN:</span> <span class="f-val">${panNumber}</span></div>` : ''}
                  </div>
                  <div class="f-qr">
                      <div id="qrcode"></div>
                  </div>
              </div>

              <div class="f-bottom">
                  <div class="f-id">ID: ${applicationData.uniqueCode || 'PENDING'}</div>
              </div>
           </div>

           <!-- BACK -->
           <div class="card card-back ${isPremier ? 'premier' : ''}">
              <div class="b-strip"></div>
              <div class="b-company">Bharatpeak Business Services</div>
              <div class="b-address-area">
                  <div class="b-addr-label">Address</div>
                  <div class="b-addr-text">${address || applicationData.personalDetails.address || ''} ${applicationData.personalDetails.city || ''}${pinCode ? ' - ' + pinCode : ''}, ${applicationData.personalDetails.state || 'India'}</div>
                  ${applicationData.personalDetails.aadhaarNumber ? `<div class="b-addr-label" style="margin-top:3px;">Aadhaar</div><div class="b-addr-text">${applicationData.personalDetails.aadhaarNumber}</div>` : ''}
                  ${bankName ? `<div class="b-addr-label" style="margin-top:3px;">Bank: ${bankName}${ifscCode ? ' | ' + ifscCode : ''}</div>` : ''}
              </div>
              
              <div class="b-footer-container">
                  <div class="b-validity-wrapper">
                      <span class="b-validity">${formattedExpiry}</span>
                  </div>
                  <div class="b-footer">
                      <div class="b-foot-item"><span class="b-foot-icon">✉</span> support@bharatpeakbs.com</div>
                      <div class="b-foot-item"><span class="b-foot-icon">☎</span> 88180 60903</div>
                      <div class="b-foot-item">
                          ${logoBase64 ? `<img src="${logoBase64}" style="height:10px;width:auto;" />` : ''}
                      </div>
                      <div class="b-foot-item"><span class="b-foot-icon">🌐</span> bharatpeakbs.com</div>
                  </div>
              </div>
           </div>

           <!-- PAGE 2: T&C -->
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
                 text: "https://application.bharatpeakbusiness.com",
                 width: 46,
                 height: 46,
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

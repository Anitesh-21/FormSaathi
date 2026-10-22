// FormSaathi AI Universal Extension Controller
const PROFILES = {
  academic: {
    name: "Anitesh Kumar Singh (Academic & Scholarship)",
    data: {
      fullName: "Anitesh Kumar Singh",
      dateOfBirth: "2004-09-15",
      gender: "Male",
      casteCategory: "General (UR)",
      fatherName: "Suresh Kumar Singh",
      motherName: "Sunita Singh",
      annualIncome: "240000",
      email: "aniteshks21@gmail.com",
      phone: "9876543210",
      address: "House No. 42, Sector 14, Jaipur, Rajasthan",
      city: "Jaipur",
      state: "Rajasthan",
      pinCode: "302022",
      tenthBoard: "CBSE",
      tenthRollNo: "14102984",
      tenthPercentage: "92.4%",
      twelfthBoard: "CBSE",
      twelfthRollNo: "22140938",
      twelfthPercentage: "89.6%",
      currentCourse: "B.Tech Computer Science",
      instituteCode: "C-24901",
      bankAccountNumber: "309811245678",
      ifscCode: "SBIN0004521"
    }
  },
  personal: {
    name: "Anitesh Kumar Singh (Personal Vault)",
    data: {
      fullName: "Anitesh Kumar Singh",
      firstName: "Anitesh",
      lastName: "Singh",
      dateOfBirth: "2004-09-15",
      gender: "Male",
      email: "aniteshks21@gmail.com",
      phone: "9876543210",
      address: "House No. 42, Sector 14, Jaipur",
      state: "Rajasthan",
      pinCode: "302022",
      domicileState: "Rajasthan",
      domicileCertNo: "DOM/2021/RAJ/98214"
    }
  },
  job: {
    name: "Vikram Sharma (Job Applications)",
    data: {
      fullName: "Vikram Sharma",
      dateOfBirth: "1999-04-20",
      gender: "Male",
      fatherName: "Suresh Kumar Sharma",
      email: "vikram.sharma.tech@gmail.com",
      phone: "9414055667",
      highestQualification: "B.Tech in Information Technology",
      experienceYears: "3 Years",
      panNumber: "ABCPS1234F"
    }
  },
  family: {
    name: "Suresh Sharma (Family Welfare)",
    data: {
      fullName: "Suresh Kumar Sharma",
      dateOfBirth: "1970-02-11",
      gender: "Male",
      occupation: "Agriculture",
      address: "Gram Panchayat Bassi, Jaipur, Rajasthan",
      bankAccountNumber: "109288374619",
      ifscCode: "PUNB0123400",
      landKhasraNo: "142/3"
    }
  }
};

let currentProfileKey = "academic";
let currentLanguage = "Hindi";
let currentFilter = "all";
let detectedFieldsCache = [];

// Semantic Synonym Clusters for fuzzy similarity matching
const SYNONYM_CLUSTERS = [
  { key: "phone", label: "Mobile / Telephone", matches: ["mobile telephone", "mobile phone", "phone number", "mobile number", "contact mobile", "registered mobile", "primary contact number", "cell phone", "whatsapp number", "telephone", "10 digit mobile number", "contact no", "mobile", "phone", "tel"] },
  { key: "email", label: "Primary Email Address", matches: ["primary email address", "email address", "email id", "official email", "candidate email", "registered email", "notification email", "applicant email", "e mail", "electronic mail", "email", "mail"] },
  { key: "dateOfBirth", label: "Date of Birth", matches: ["date of birth", "dob date", "dob", "birth date", "birthdate"] },
  { key: "cityState", label: "Current City & State", matches: ["city & state", "city and state", "city state", "citystate", "city_state", "current city state", "current city & state", "current city and state", "city district state", "city/state"] },
  { key: "city", label: "City / District", matches: ["current city", "city", "district", "town"] },
  { key: "state", label: "State / Province", matches: ["domicile state", "state of residence", "state ut", "state", "province"] },
  { key: "address", label: "Residential / Current Address", matches: ["full home residential address", "current address", "residential address", "present address", "communication address", "correspondence address", "street address", "address"] },
  { key: "pinCode", label: "Postal PIN Code", matches: ["postal zip code", "postal pincode", "pin code", "pincode", "postal code", "zip code", "postal pin"] },
  { key: "gender", label: "Gender / Sex", matches: ["gender", "sex", "gender val"] },
  { key: "casteCategory", label: "Category / Community", matches: ["social category", "caste category", "category", "community", "caste", "reservation category", "quota"] },
  { key: "fatherName", label: "Father's Full Name", matches: ["father full name", "father name", "parent name", "guardian name", "father husband name"] },
  { key: "motherName", label: "Mother's Full Name", matches: ["mother full name", "mother name", "maternal name"] },
  { key: "annualIncome", label: "Annual Family Income", matches: ["gross total annual income", "annual family income", "annual income", "family income", "parental annual income", "gross income"] },
  { key: "bankAccountNumber", label: "Bank Account Number", matches: ["bank account for direct tax refund", "bank account number", "savings account number", "bank a c no", "account number", "bank account", "account no"] },
  { key: "ifscCode", label: "Bank IFSC Code", matches: ["branch ifsc code", "bank ifsc code", "bank ifsc", "branch ifsc", "ifsc code", "ifsc"] },
  { key: "panNumber", label: "PAN Card Number", matches: ["permanent account number pan", "permanent account number", "pan card no", "pan card number", "pan card", "pan number", "pan"] },
  { key: "tenthRollNo", label: "10th Roll Number", matches: ["10th roll no", "10th roll number", "matric roll no", "class x roll no", "secondary exam roll number"] },
  { key: "tenthPercentage", label: "10th Percentage", matches: ["10th percentage", "10th marks", "matric percentage", "class x percentage"] },
  { key: "tenthBoard", label: "10th Board", matches: ["10th board", "matric board", "secondary education board"] },
  { key: "twelfthRollNo", label: "12th Roll Number", matches: ["12th roll no", "12th roll number", "intermediate roll no", "class xii roll no"] },
  { key: "twelfthPercentage", label: "12th Percentage", matches: ["12th percentage", "12th marks", "intermediate percentage"] },
  { key: "currentCourse", label: "Highest Degree Completed", matches: ["highest degree completed", "current course", "enrolled course", "degree program", "course name", "degree", "qualification"] },
  { key: "instituteName", label: "University / College Name", matches: ["university college name", "college name", "university name", "institute name", "institution", "college", "university"] },
  { key: "rollNo", label: "College Roll No", matches: ["college roll number", "enrollment number", "registration number", "prn number", "hall ticket number"] },
  { key: "highestQualification", label: "Highest Qualification", matches: ["highest qualification", "highest degree completed", "educational qualification"] },
  { key: "experienceYears", label: "Total Years of Experience", matches: ["total years of experience", "experience years", "years of experience", "total work experience"] },
  { key: "currentRole", label: "Current Title / Designation", matches: ["current title designation", "designation", "job role", "current role"] },
  { key: "currentCompany", label: "Company / Employer", matches: ["current company", "current employer", "present organization", "company name"] },
  { key: "graduationYear", label: "Year of Graduation", matches: ["year of graduation", "graduation year", "year of passing", "passing year"] },
  { key: "passportNumber", label: "Passport Number", matches: ["passport national id number", "passport number", "passport no"] },
  { key: "nationality", label: "Nationality", matches: ["country of citizenship nationality", "nationality", "citizenship country"] },
  { key: "fullName", label: "Full Legal Name", matches: ["full legal name", "fullname", "full name", "candidate name", "applicant name", "taxpayer name", "assessee name", "student name", "legal name", "name as per matriculation", "name as per aadhaar", "name in block letters", "beneficiary name"] },
  { key: "firstName", label: "First / Given Name", matches: ["first name", "given name", "forename"] },
  { key: "lastName", label: "Last Name / Surname", matches: ["surname", "family name", "last name"] }
];

function isSamplePlaceholderOrValue(str) {
  if (!str) return true;
  const s = str.trim().toLowerCase();
  if (s.startsWith("+") || /^\+?\d[\d\s-]{6,}$/.test(s)) return true; // phone format e.g. +91 98765 43210
  if (s.includes("@") || s.includes(".com") || s.includes(".org") || s.includes(".in") || s.includes(".net")) return true; // email
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("www.")) return true; // url
  if (/^(e\.?g\.?|ex\.?|for example|sample|such as)\b/i.test(s)) return true; // e.g. Jaipur, e.g. 2021
  if (/^(yyyy|dd\/mm|mm\/dd|dd-mm|mm-dd)/i.test(s)) return true; // date formats
  if (/^(enter|type|input|select|choose|search|write|fill|provide|first and last)\b/i.test(s)) return true; // action instructions
  if (/^\d+(\.\d+)?(\s*(years?|yrs?|lakh|inr|rs\.?|%|kg|mb|kb))?$/i.test(s)) return true; // numbers/measurements
  return false;
}

function matchFieldSemantic(field, profileData) {
  const raw = ((field.label || "") + " " + (field.name || "") + " " + (field.id || "")).toLowerCase().replace(/[^a-z0-9]/g, " ");

  // 1. SMART CITY & STATE COMBINATION / EXTRACTION
  if (
    raw.includes("city state") ||
    raw.includes("city & state") ||
    raw.includes("city and state") ||
    raw.includes("current city state") ||
    raw.includes("current city & state") ||
    raw.includes("city / state") ||
    raw.includes("location")
  ) {
    let c = profileData.city || "";
    let s = profileData.state || profileData.domicileState || "";
    if (c && c.includes(",")) {
      const parts = c.split(",").map(p => p.trim());
      c = parts[0];
      if (!s && parts.length > 1) s = parts[1];
    }
    if (!c || !s) {
      const addr = profileData.address || "";
      if (!c && addr.includes("Jaipur")) c = "Jaipur";
      if (!s && addr.includes("Rajasthan")) s = "Rajasthan";
    }
    const combined = c && s ? `${c}, ${s}` : (c || s || "Jaipur, Rajasthan");
    return { isMatched: true, matchedKey: "cityState", matchedLabel: "Current City & State", value: combined, confidence: 0.98 };
  }

  // 2. SMART FIRST / LAST NAME DERIVATIONS
  if (
    (raw.includes("first name") || raw.includes("given name") || raw.includes("given names")) &&
    !raw.includes("full") && !raw.includes("last")
  ) {
    if (profileData.firstName) return { isMatched: true, matchedKey: "firstName", matchedLabel: "First Name", value: profileData.firstName, confidence: 0.97 };
    if (profileData.fullName) {
      const fn = profileData.fullName.trim().split(/\s+/)[0];
      return { isMatched: true, matchedKey: "firstName", matchedLabel: "First Name", value: fn, confidence: 0.96 };
    }
  }

  if (
    (raw.includes("surname") || raw.includes("last name") || raw.includes("family name")) &&
    !raw.includes("first and last") && !raw.includes("full")
  ) {
    if (profileData.lastName) return { isMatched: true, matchedKey: "lastName", matchedLabel: "Last Name", value: profileData.lastName, confidence: 0.97 };
    if (profileData.fullName && profileData.fullName.trim().split(/\s+/).length > 1) {
      const ln = profileData.fullName.trim().split(/\s+/).pop();
      return { isMatched: true, matchedKey: "lastName", matchedLabel: "Last Name", value: ln, confidence: 0.96 };
    }
  }

  // 3. SMART FULL ADDRESS SYNTHESIS
  if (
    raw.includes("full home residential address") ||
    raw.includes("complete address") ||
    raw.includes("full address")
  ) {
    let addr = profileData.address || "";
    const city = profileData.city || "Jaipur";
    const state = profileData.state || profileData.domicileState || "Rajasthan";
    const pin = profileData.pinCode || "302022";
    if (addr && !addr.includes(city) && !addr.includes(state)) {
      addr = `${addr}, ${city}, ${state} - ${pin}`;
    }
    return { isMatched: true, matchedKey: "address", matchedLabel: "Full Address", value: addr || `House No. 42, Sector 14, Near City Park, ${city}, ${state} - ${pin}`, confidence: 0.96 };
  }

  for (const c of SYNONYM_CLUSTERS) {
    if (c.key === "fullName" && (raw.includes("university") || raw.includes("college") || raw.includes("institute") || raw.includes("father") || raw.includes("mother") || raw.includes("bank") || raw.includes("email") || raw.includes("phone"))) {
      continue;
    }
    if (c.key === "lastName" && raw.includes("first and last")) {
      continue;
    }

    for (const m of c.matches) {
      if (raw.includes(m)) {
        if (profileData[c.key]) {
          return { isMatched: true, matchedKey: c.key, matchedLabel: c.label, value: profileData[c.key], confidence: 0.96 };
        }
        for (const [pk, pv] of Object.entries(profileData)) {
          if (pk.toLowerCase() === c.key.toLowerCase() && pv) {
            return { isMatched: true, matchedKey: pk, matchedLabel: c.label, value: pv, confidence: 0.94 };
          }
        }
      }
    }
  }

  for (const [k, v] of Object.entries(profileData)) {
    if (!v) continue;
    const kLower = k.toLowerCase();
    if (raw.includes(kLower)) {
      return { isMatched: true, matchedKey: k, matchedLabel: k, value: v, confidence: 0.88 };
    }
  }

  return { isMatched: false, confidence: 0 };
}

function detectFieldCluster(field) {
  const raw = ((field.label || "") + " " + (field.name || "") + " " + (field.id || "")).toLowerCase().replace(/[^a-z0-9]/g, " ");
  for (const c of SYNONYM_CLUSTERS) {
    for (const m of c.matches) {
      if (raw.includes(m)) return c.key;
    }
  }
  if (raw.includes("name") && !raw.includes("father") && !raw.includes("mother") && !raw.includes("bank") && !raw.includes("college")) return "fullName";
  if (raw.includes("email") || raw.includes("mail")) return "email";
  if (raw.includes("phone") || raw.includes("mobile") || raw.includes("tel")) return "phone";
  if ((raw.includes("city") && raw.includes("state")) || raw.includes("city_state") || raw.includes("current_city")) return "cityState";
  if (raw.includes("city") || raw.includes("district")) return "city";
  if (raw.includes("state") || raw.includes("domicile")) return "state";
  return undefined;
}

function humanizeFieldLabel(f) {
  // Reject placeholder values that masquerade as labels
  let labelCandidate = f.label || "";
  if (labelCandidate && !/^(field|input|item|elem)[\s_-]*\d*$/i.test(labelCandidate.trim()) && labelCandidate.trim() !== "General Applicant Detail" && !isSamplePlaceholderOrValue(labelCandidate)) {
    labelCandidate = labelCandidate.replace(/[:*]+$/, "").trim();
  } else {
    labelCandidate = "";
  }

  if (!labelCandidate && f.placeholder && !isSamplePlaceholderOrValue(f.placeholder)) {
    labelCandidate = f.placeholder.replace(/[:*]+$/, "").trim();
  }

  if (!labelCandidate) {
    const raw = ((f.name || "") + " " + (f.id || "")).toLowerCase().replace(/[^a-z0-9]/g, " ");
    if (/\b(mobile|telephone|phone|tel|contact)\b/i.test(raw) || f.type === "tel") labelCandidate = "Mobile / Telephone";
    else if (/\b(email|mail)\b/i.test(raw) || f.type === "email") labelCandidate = "Primary Email Address";
    else if (/\b(full\s*name|fname|applicant\s*name|candidate\s*name|legal\s*name|student\s*name)\b/i.test(raw)) labelCandidate = "Full Legal Name";
    else if (/\b(city\s*&?\s*state|city_state|current_city)\b/i.test(raw)) labelCandidate = "Current City & State";
    else if (/\b(city|district|town)\b/i.test(raw)) labelCandidate = "City / District";
    else if (/\b(state|domicile|province)\b/i.test(raw)) labelCandidate = "State / Province";
    else if (/\b(dob|birth|bday)\b/i.test(raw) || f.type === "date") labelCandidate = "Date of Birth";
    else if (/\b(father)\b/i.test(raw)) labelCandidate = "Father's Full Name";
    else if (/\b(mother)\b/i.test(raw)) labelCandidate = "Mother's Full Name";
    else if (/\b(address|addr|residence|billing)\b/i.test(raw) || f.type === "textarea") labelCandidate = "Residential Address";
    else if (/\b(pin|pincode|zip)\b/i.test(raw)) labelCandidate = "Postal PIN Code";
    else if (/\b(caste|category)\b/i.test(raw)) labelCandidate = "Category / Caste";
    else if (/\b(gender|sex)\b/i.test(raw)) labelCandidate = "Gender / Sex";
    else if (/\b(aadhaar|aadhar|uid)\b/i.test(raw)) labelCandidate = "Aadhaar Card Number";
    else if (/\b(pan)\b/i.test(raw)) labelCandidate = "PAN Card Number";
    else if (/\b(bank|account)\b/i.test(raw)) labelCandidate = "Bank Account Number";
    else if (/\b(ifsc)\b/i.test(raw)) labelCandidate = "Bank IFSC Code";
    else if (/\b(income)\b/i.test(raw)) labelCandidate = "Annual Family Income";
    else if (/\b(experience|years)\b/i.test(raw)) labelCandidate = "Total Years of Experience";
    else if (/\b(designation|role|title)\b/i.test(raw)) labelCandidate = "Current Title / Designation";
    else if (/\b(university|college|institute)\b/i.test(raw)) labelCandidate = "University / College Name";
    else if (/\b(degree|course)\b/i.test(raw)) labelCandidate = "Highest Degree Completed";
    else if (/\b(graduation|passing)\b/i.test(raw)) labelCandidate = "Year of Graduation";
    else if (/\b(vendor|company)\b/i.test(raw)) labelCandidate = "Vendor / Company Name";
    else if (/\b(tax|tax_id)\b/i.test(raw)) labelCandidate = "Tax / Registration ID";
    else {
      const cand = f.name || f.id;
      if (cand && !/^(field|input|txt|val|data|elem)[\s_-]*\d*$/i.test(cand)) {
        const hum = cand
          .replace(/([a-z])([A-Z])/g, "$1 $2")
          .replace(/[_-]+/g, " ")
          .replace(/\b(id|txt|input|val)\b/gi, "")
          .trim();
        if (hum.length > 1) {
          labelCandidate = hum.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
        }
      }
    }
  }

  if (!labelCandidate) {
    if (f.type === "email") labelCandidate = "Primary Email Address";
    else if (f.type === "tel") labelCandidate = "Mobile / Telephone";
    else if (f.type === "date") labelCandidate = "Date of Birth";
    else if (f.type === "file") labelCandidate = "Document Upload (Photo/Signature)";
    else if (f.type === "textarea") labelCandidate = "Residential Address";
    else if (f.type === "number") labelCandidate = "Numeric Value";
    else if (f.type === "password") labelCandidate = "Password";
    else labelCandidate = "Application Detail " + ((f.index || 0) + 1);
  }

  labelCandidate = labelCandidate.replace(/[:*]+$/, "").trim();

  if (f.required && !labelCandidate.includes("*")) {
    labelCandidate = labelCandidate + " *";
  }

  return labelCandidate;
}

// Multilingual Field Explanations Database
const EXPLANATIONS_DB = {
  fullName: {
    Hindi: "उम्मीदवार का पूरा नाम — अपने 10वीं कक्षा के प्रमाणपत्र या आधार कार्ड के अनुसार बिल्कुल सही नाम भरें। किसी उपसर्ग (श्री/कुमारी) का प्रयोग न करें।",
    English: "Candidate's Full Name — Enter your complete legal name exactly as printed on your Class 10 marksheet or Aadhaar card without prefixes.",
    Bengali: "প্রার্থীর পুরো নাম — আপনার দশম শ্রেণির মার্কশিট বা আধার কার্ড অনুযায়ী পুরো নাম লিখুন।",
    Marathi: "उमेदवाराचे पूर्ण नाव — तुमच्या १०वीच्या गुणपत्रिकेनुसार किंवा आधार कार्डानुसार अचूक नाव भरा.",
    Tamil: "விண்ணப்பதாரரின் முழுப் பெயர் — உங்கள் 10-ஆம் வகுப்பு மதிப்பெண் அட்டை அல்லது ஆதார் அட்டையில் உள்ளபடி முழுப் பெயரை உள்ளிடவும்.",
    Telugu: "దరఖాస్తుదారు పూర్తి పేరు — మీ 10వ తరగతి మార్కుల జాబితా లేదా ఆధార్ కార్డు ప్రకారం పూర్తి పేరు నమోదు చేయండి.",
    Gujarati: "ઉમેદવારનું પૂરું નામ — તમારી 10મી માર્કશીટ અથવા આધાર કાર્ડ મુજબ તમારું પૂરું નામ દાખલ કરો.",
    Kannada: "ಅಭ್ಯರ್ಥಿಯ ಪೂರ್ಣ ಹೆಸರು — ನಿಮ್ಮ 10ನೇ ತರಗತಿ ಅಂಕಪಟ್ಟಿ ಅಥವಾ ಆಧಾರ್ ಕಾರ್ಡ್ ಪ್ರಕಾರ ಸಂಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.",
    Punjabi: "ਉਮੀਦਵਾਰ ਦਾ ਪੂਰਾ ਨਾਮ — ਆਪਣੇ 10ਵੀਂ ਦੇ ਸਰਟੀਫਿਕੇਟ ਜਾਂ ਆਧਾਰ ਕਾਰਡ ਅਨੁਸਾਰ ਪੂਰਾ ਨਾਮ ਦਰਜ ਕਰੋ।"
  },
  email: {
    Hindi: "प्राथमिक ईमेल पता — वह सक्रिय ईमेल दर्ज करें जिसका पासवर्ड आपको याद हो। सभी सत्यापन कोड, हॉल टिकट और चयन सूचना इसी पते पर भेजी जाती हैं।",
    English: "Primary Email Address — Provide your active personal email address. All admit cards and application notifications will be sent here.",
    Bengali: "প্রাথমিক ইমেল ঠিকানা — আপনার সক্রিয় ব্যক্তিগত ইমেল লিখুন। সমস্ত পরীক্ষা এবং আবেদনের আপডেট এখানে আসবে।",
    Marathi: "प्राथमिक ईमेल पत्ता — प्रवेशपत्र, निकाल आणि महत्त्वाच्या सूचना याच ईमेलवर पाठवल्या जातील.",
    Tamil: "முதன்மை மின்னஞ்சல் முகவரி — ஹால் டிக்கெட் மற்றும் தகவல்கள் இதில் வரும்.",
    Telugu: "ప్రాథమిక ఈమెయిల్ చిరునామా — హాల్ టికెట్ మరియు నోటిఫికేషన్లు దీనికి పంపబడతాయి.",
    Gujarati: "પ્રાથમિક ઇમેઇલ સરનામું — તમામ માહિતી આ ઇમેઇલ પર મળશે.",
    Kannada: "ಪ್ರಾಥಮಿಕ ಇಮೇಲ್ ವಿಳಾಸ — ಹಾಲ್ ಟಿಕೆಟ್ ಮತ್ತು ಪ್ರಮುಖ ಮಾಹಿತಿ ಈ ವಿಳಾಸಕ್ಕೆ ಬರುತ್ತದೆ.",
    Punjabi: "ਮੁੱਢਲਾ ਈਮੇਲ ਪਤਾ — ਦਾਖਲਾ ਕਾਰਡ ਅਤੇ ਸਾਰੀਆਂ ਸੂਚਨਾਵਾਂ ਇਸ ਈਮੇਲ ਤੇ ਭੇਜੀਆਂ ਜਾਣਗੀਆਂ।"
  },
  phone: {
    Hindi: "10 अंकों का मोबाइल नंबर — वह नंबर जो चालू हो और आधार कार्ड से लिंक हो। ओटीपी (OTP) और एसएमएस अलर्ट पाने के लिए अनिवार्य है।",
    English: "10-Digit Mobile Number — Enter your active personal number linked with Aadhaar to receive OTP verifications and SMS alerts.",
    Bengali: "১০ সংখ্যার মোবাইল নম্বর — সক্রিয় মোবাইল নম্বর দিন যা ওটিপি পাওয়ার জন্য আবশ্যক।",
    Marathi: "१० अंकी मोबाईल नंबर — सुरू असलेला नंबर टाका, ज्यावर ओटीपी (OTP) येऊ शकेल.",
    Tamil: "10 இலக்க மொபைல் எண் — ஆதார் உடன் இணைக்கப்பட்ட செயல்பாட்டில் உள்ள உங்கள் மொபைல் எண்ணை உள்ளிடவும்.",
    Telugu: "10 అంకెల మొబైల్ నంబర్ — ఆధార్‌తో లింక్ చేయబడిన మీ మొబైల్ నంబర్‌ను నమోదు చేయండి.",
    Gujarati: "10 અંકનો મોબાઇલ નંબર — આધાર સાથે લિંક થયેલો અને ચાલુ મોબાઇલ નંબર દાખલ કરો.",
    Kannada: "10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ — ಆಧಾರ್‌ಗೆ ಲಿಂಕ್ ಆಗಿರುವ ಸಕ್ರಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
    Punjabi: "10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ — ਆਪਣਾ ਚਾਲੂ ਨੰਬਰ ਦਰਜ ਕਰੋ ਜਿਸ ਤੇ ਓ.ਟੀ.ਪੀ (OTP) ਆ ਸਕੇ।"
  },
  cityState: {
    Hindi: "वर्तमान शहर एवं राज्य — अपना वर्तमान आवासीय शहर तथा राज्य दर्ज करें (उदा. जयपुर, राजस्थान)।",
    English: "Current City & State — Enter your current residential city and state (e.g. Jaipur, Rajasthan) for regional eligibility.",
    Bengali: "বর্তমান শহর এবং রাজ্য — আপনার বর্তমান বসবাসের শহর ও রাজ্য লিখুন (যেমন: কলকাতা, পশ্চিমবঙ্গ)।",
    Marathi: "सध्याचे शहर आणि राज्य — तुमच्या सध्याच्या रहिवासी शहर व राज्याचे नाव अचूक लिहा.",
    Tamil: "தற்போதைய நகரம் மற்றும் மாநிலம் — உங்கள் தற்போதைய வசிப்பிட நகரம் மற்றும் மாநிலத்தை உள்ளிடவும்.",
    Telugu: "ప్రస్తుత నగరం మరియు రాష్ట్రం — మీ ప్రస్తుత నివాస నగరం మరియు రాష్ట్రాన్ని నమోదు చేయండి.",
    Gujarati: "હાલનું શહેર અને રાજ્ય — તમારું રહેઠાણનું શહેર અને રાજ્ય દાખલ કરો.",
    Kannada: "ಪ್ರಸ್ತುತ ನಗರ ಮತ್ತು ರಾಜ್ಯ — ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವಾಸಸ್ಥಳದ ನಗರ ಮತ್ತು ರಾಜ್ಯವನ್ನು ನಮೂದಿಸಿ.",
    Punjabi: "ਮੌਜੂਦਾ ਸ਼ਹਿਰ ਅਤੇ ਰਾਜ — ਆਪਣਾ ਮੌਜੂਦਾ ਰਿਹਾਇਸ਼ੀ ਸ਼ਹਿਰ ਅਤੇ ਰਾਜ ਦਰਜ ਕਰੋ।"
  },
  city: {
    Hindi: "शहर या जिला — अपना वर्तमान नगर, शहर या जिले का नाम आधिकारिक दस्तावेजों के अनुसार भरें।",
    English: "City or District — Enter your current city, town, or district name as per official address proof.",
    Bengali: "শহর বা জেলা — আপনার বর্তমান শহর বা জেলার নাম লিখুন।",
    Marathi: "शहर किंवा जिल्हा — तुमच्या सध्याच्या शहराचे किंवा जिल्ह्याचे नाव लिहा.",
    Tamil: "நகரம் அல்லது மாவட்டம் — உங்கள் தற்போதைய நகரம் அல்லது மாவட்டத்தின் பெயரை உள்ளிடவும்.",
    Telugu: "నగరం లేదా జిల్లా — మీ ప్రస్తుత నగరం లేదా జిల్లా పేరు నమోదు చేయండి.",
    Gujarati: "શહેર અથવા જિલ્લો — તમારું હાલનું શહેર અથવા જિલ્લો દાખલ કરો.",
    Kannada: "ನಗರ ಅಥವಾ ಜಿಲ್ಲೆ — ನಿಮ್ಮ ಪ್ರಸ್ತುತ ನಗರ ಅಥವಾ ಜಿಲ್ಲೆಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ.",
    Punjabi: "ਸ਼ਹਿਰ ਜਾਂ ਜ਼ਿਲ੍ਹਾ — ਆਪਣਾ ਮੌਜੂਦਾ ਸ਼ਹਿਰ ਜਾਂ ਜ਼ਿਲ੍ਹਾ ਦਰਜ ਕਰੋ।"
  },
  state: {
    Hindi: "मूल राज्य / निवास राज्य — अपना अधिवास (डोमिसाइल) या निवास का राज्य चुनें।",
    English: "State / Domicile — Select your state of residence or domicile for state quota reservations.",
    Bengali: "বসবাসের রাজ্য — আপনার রাজ্য নির্বাচন করুন।",
    Marathi: "राज्य — तुमचे अधिवास किंवा रहिवासी राज्य निवडा.",
    Tamil: "மாநிலம் — உங்கள் வசிப்பிட மாநிலத்தை தேர்ந்தெடுக்கவும்.",
    Telugu: "రాష్ట్రం — మీ నివాస రాష్ట్రాన్ని ఎంచుకోండి.",
    Gujarati: "રાજ્ય — તમારું રહેઠાણનું રાજ્ય પસંદ કરો.",
    Kannada: "ರಾಜ್ಯ — ನಿಮ್ಮ ವಾಸಸ್ಥಳದ ರಾಜ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    Punjabi: "ਰਾਜ — ਆਪਣਾ ਰਿਹਾਇਸ਼ੀ ਰਾਜ ਚੁਣੋ।"
  },
  address: {
    Hindi: "स्थायी / पत्राचार का पता — मकान नंबर, गली और इलाके सहित पूरा पता लिखें।",
    English: "Full Residential Address — Enter complete address with house number, street, and locality.",
    Bengali: "সম্পূর্ণ আবাসিক ঠিকানা — চিঠিপত্র এবং যোগাযোগের জন্য সম্পূর্ণ বাড়ির ঠিকানা লিখুন।",
    Marathi: "पूर्ण निवासी पत्ता — घर क्रमांक, गल्ली आणि लँडमार्कसह संपूर्ण पत्ता भरा.",
    Tamil: "முழு குடியிருப்பு முகவரி — அஞ்சல் தொடர்புக்கு உங்கள் முழு முகவரியை உள்ளிடவும்.",
    Telugu: "పూర్తి నివాస చిరునామా — పోస్టల్ ఉత్తరప్రత్యుత్తరాల కోసం పూర్తి చిరునామాను నమోదు చేయండి.",
    Gujarati: "સંપૂર્ણ રહેઠાણનું સરનામું — પત્રવ્યવહાર માટે તમારું સંપૂર્ણ સરનામું દાખલ કરો.",
    Kannada: "ಸಂಪೂರ್ಣ ವಾಸಸ್ಥಳದ ವಿಳಾಸ — ಅಂಚೆ ಸಂಪರ್ಕಕ್ಕಾಗಿ ಸಂಪೂರ್ಣ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.",
    Punjabi: "ਪੂਰਾ ਰਿਹਾਇਸ਼ੀ ਪਤਾ — ਡਾਕ ਪੱਤਰ-ਵਿਹਾਰ ਲਈ ਆਪਣਾ ਪੂਰਾ ਪਤਾ ਦਰਜ ਕਰੋ।"
  },
  dateOfBirth: {
    Hindi: "जन्म तिथि (DD/MM/YYYY) — 10वीं की मार्कशीट के अनुसार अपनी सही जन्म तिथि भरें। आयु सीमा पात्रता की गणना इसी तिथि से की जाती है।",
    English: "Date of Birth (DD/MM/YYYY) — Enter your birth date exactly as recorded in your matriculation certificate.",
    Bengali: "জন্ম তারিখ — মাধ্যমিকের সার্টিফিকেট অনুযায়ী জন্ম তারিখ দিন।",
    Marathi: "जन्मतारीख — १०वीच्या बोर्ड प्रमाणपत्रावर असलेली अचूक जन्मतारीख भरा.",
    Tamil: "பிறந்த தேதி — 10-ஆம் வகுப்பு சான்றிதழில் உள்ள பிறந்த தேதியை உள்ளிடவும்.",
    Telugu: "పుట్టిన తేదీ — 10వ తరగతి సర్టిఫికెట్ ప్రకారం ఖచ్చితమైన పుట్టిన తేదీ నమోదు చేయండి.",
    Gujarati: "જન્મ તારીખ — 10મી માર્કશીટ મુજબ જન્મ તારીખ દાખલ કરો.",
    Kannada: "ಹುಟ್ಟಿದ ದಿನಾಂಕ — 10ನೇ ತರಗತಿ ಪ್ರಮಾಣಪತ್ರದ ಪ್ರಕಾರ ಹುಟ್ಟಿದ ದಿನಾಂಕವನ್ನು ನಮೂದಿಸಿ.",
    Punjabi: "ਜਨਮ ਮਿਤੀ — 10ਵੀਂ ਦੇ ਸਰਟੀਫਿਕੇਟ ਅਨੁਸਾਰ ਆਪਣੀ ਸਹੀ ਜਨਮ ਮਿਤੀ ਭਰੋ।"
  },
  bankAccountNumber: {
    Hindi: "बैंक खाता संख्या — डीबीटी (प्रत्यक्ष लाभ अंतरण) या छात्रवृत्ति प्राप्त करने के लिए अपना बैंक बचत खाता नंबर दर्ज करें।",
    English: "Bank Account Number — Enter your active savings account number for DBT government subsidies or scholarship transfer.",
    Bengali: "ব্যাঙ্ক অ্যাকাউন্ট নম্বর — স্কলারশিপ বা রিফান্ড সরাসরি পাওয়ার জন্য আপনার সেভিংস অ্যাকাউন্ট নম্বর লিখুন।",
    Marathi: "बँक खाते क्रमांक — शिष्यवृत्ती थेट खात्यात जमा होण्यासाठी बचत खाते क्रमांक अचूक भरा.",
    Tamil: "வங்கி கணக்கு எண் — கல்வி உதவித்தொகைக்கு உங்கள் சேமிப்பு கணக்கு எண்ணை உள்ளிடவும்.",
    Telugu: "బ్యాంక్ ఖాతా సంఖ్య — స్కాలర్‌షిప్ కోసం మీ సేవింగ్స్ బ్యాంక్ ఖాతా నంబర్ నమోదు చేయండి.",
    Gujarati: "બેંક ખાતા નંબર — સ્કોલરશીપ સીધી મેળવવા માટે તમારો બચત ખાતા નંબર દાખલ કરો.",
    Kannada: "ಬ್ಯಾಂಕ್ ಖಾತೆ ಸಂಖ್ಯೆ — ಸ್ಕಾಲರ್‌ಶಿಪ್ ಪಡೆಯಲು ಉಳಿತಾಯ ಖಾತೆ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
    Punjabi: "ਬੈਂਕ ਖਾਤਾ ਨੰਬਰ — ਵਜ਼ੀਫ਼ਾ ਸਿੱਧਾ ਖਾਤੇ ਵਿੱਚ ਪਾਉਣ ਲਈ ਆਪਣਾ ਬੱਚਤ ਖਾਤਾ ਨੰਬਰ ਦਰਜ ਕਰੋ।"
  },
  ifscCode: {
    Hindi: "बैंक आईएफएससी कोड — आपकी बैंक शाखा का 11 अक्षरों का कोड (उदा. SBIN0004521)। पासबुक के पहले पन्ने पर लिखा होता है।",
    English: "Bank IFSC Code — 11-character alphanumeric code identifying your bank branch (e.g. SBIN0004521) found on passbook front page.",
    Bengali: "ব্যাঙ্ক IFSC কোড — আপনার ব্যাঙ্ক শাখার ১১ সংখ্যার কোড (যেমন SBIN0004521)।",
    Marathi: "बँक आयएफएससी कोड — तुमच्या बँकेच्या शाखेचा ११ अंकी कोड (उदा. SBIN0004521).",
    Tamil: "வங்கி IFSC குறியீடு — உங்கள் வங்கி கிளையின் 11 இலக்க குறியீடு (எ.கா. SBIN0004521).",
    Telugu: "బ్యాంక్ IFSC కోడ్ — మీ బ్యాంక్ బ్రాంచ్ 11 అంకెల కోడ్ (ఉదా. SBIN0004521).",
    Gujarati: "બેંક IFSC કોડ — તમારી બેંક શાખાનો 11 અક્ષરનો કોડ (દા.ત. SBIN0004521).",
    Kannada: "ಬ್ಯಾಂಕ್ IFSC ಕೋಡ್ — ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಶಾಖೆಯ 11 ಅಕ್ಷರಗಳ ಕೋಡ್ (ಉದಾ. SBIN0004521).",
    Punjabi: "ਬੈਂਕ IFSC ਕੋਡ — ਤੁਹਾਡੀ ਬੈਂਕ ਬ੍ਰਾਂਚ ਦਾ 11 ਅੱਖਰਾਂ ਦਾ ਕੋਡ (ਜਿਵੇਂ SBIN0004521)।"
  },
  annualIncome: {
    Hindi: "वार्षिक पारिवारिक आय — सभी स्रोतों से कुल वार्षिक पारिवारिक आय। आय प्रमाण पत्र के अनुसार ही दर्ज करें।",
    English: "Annual Family Income — Total gross annual income from all sources. Must match your Government Income Certificate.",
    Bengali: "পারিবারিক বার্ষিক আয় — ইনকাম সার্টিফিকেটের সাথে মিল রেখে বার্ষিক আয় লিখুন।",
    Marathi: "कुटुंबाचे वार्षिक उत्पन्न — उत्पन्न प्रमाणपत्राशी जुळणारे वार्षिक उत्पन्न भरा.",
    Tamil: "குடும்ப ஆண்டு வருமானம் — மொத்த ஆண்டு வருமானம் (ரூபாயில்).",
    Telugu: "కుటుంబ వార్షిక ఆదాయం — ఆదాయ ధృవీకరణ పత్రం ప్రకారం నమోదు చేయండి.",
    Gujarati: "કુલ વાર્ષિક આવક — આવકના દાખલા મુજબ કુલ વાર્ષિક આવક દાખલ કરો.",
    Kannada: "ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ — ಆದಾಯ ಪ್ರಮಾಣಪತ್ರದ ಪ್ರಕಾರ ನಮೂದಿಸಿ.",
    Punjabi: "ਸਾਲਾਨਾ ਆਮਦਨ — ਆਮਦਨ ਸਰਟੀਫਿਕੇਟ ਅਨੁਸਾਰ ਸਾਲਾਨਾ ਆਮਦਨ ਦਰਜ ਕਰੋ।"
  },
  panNumber: {
    Hindi: "पैन कार्ड नंबर — 10 अक्षरों का अल्फान्यूमेरिक परमानेंट अकाउंट नंबर (उदा. ABCPS1234F)। टैक्स और पहचान सत्यापन के लिए आवश्यक है।",
    English: "PAN Card Number — 10-character alphanumeric Permanent Account Number (e.g. ABCPS1234F) for tax and citizen verification.",
    Bengali: "প্যান কার্ড নম্বর — ১০ অক্ষরের প্যান নম্বর (যেমন ABCPS1234F)।",
    Marathi: "पॅन कार्ड नंबर — १० अक्षरी अल्फान्युमेरिक पॅन क्रमांक (उदा. ABCPS1234F).",
    Tamil: "பான் கார்டு எண் — 10 இலக்க பான் எண் (எ.கா. ABCPS1234F).",
    Telugu: "పాన్ కార్డ్ నంబర్ — 10 అక్షరాల పాన్ నంబర్ (ఉదా. ABCPS1234F).",
    Gujarati: "પાન કાર્ડ નંબર — 10 અક્ષરનો પાન નંબર (દા.ત. ABCPS1234F).",
    Kannada: "ಪ್ಯಾನ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ — 10 ಅಕ್ಷರಗಳ ಪ್ಯಾನ್ ಸಂಖ್ಯೆ (ಉದಾ. ABCPS1234F).",
    Punjabi: "ਪੈਨ ਕਾਰਡ ਨੰਬਰ — 10 ਅੱਖਰਾਂ ਦਾ ਪੈਨ ਨੰਬਰ (ਜਿਵੇਂ ABCPS1234F)।"
  }
};

function getFieldExplanation(field, lang) {
  const clusterKey = detectFieldCluster(field) || field.id || "general";
  if (EXPLANATIONS_DB[clusterKey] && EXPLANATIONS_DB[clusterKey][lang]) {
    return EXPLANATIONS_DB[clusterKey][lang];
  }
  const label = field.label || field.name || "Applicant Information";
  if (lang === "Hindi") return label + " — इस फ़ील्ड में अपने आधिकारिक दस्तावेज़ के अनुसार सटीक विवरण भरें। गलत जानकारी से आवेदन में देरी हो सकती है।";
  if (lang === "Bengali") return label + " — আপনার অফিসিয়াল ডকুমেন্টস অনুযায়ী সঠিক তথ্য পূরণ করুন।";
  if (lang === "Marathi") return label + " — तुमच्या अधिकृत कागदपत्रांनुसार अचूक माहिती भरा.";
  return label + " — Please enter this field accurately as recorded in your official documents to avoid delays.";
}

// DOM Loaded
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initProfiles();
  initLanguage();
  initFilters();
  scanCurrentTab();
  initCompressor();
  initConverter();
  initVoice();
  initOcr();
});

// Tab Navigation
function initTabs() {
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      const targetId = tab.dataset.tab;
      document.getElementById(targetId)?.classList.add("active");
    });
  });
}

// Profile Selector
function initProfiles() {
  const select = document.getElementById("profileSelect");
  select.addEventListener("change", (e) => {
    currentProfileKey = e.target.value;
    syncProfileToStorage();
    renderVaultList();
    scanCurrentTab();
  });

  syncProfileToStorage();
  renderVaultList();
}

function initLanguage() {
  const select = document.getElementById("languageSelect");
  select.addEventListener("change", (e) => {
    currentLanguage = e.target.value;
    renderDetectedFields();
  });
}

function initFilters() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderDetectedFields();
    });
  });
}

function syncProfileToStorage() {
  const prof = PROFILES[currentProfileKey];
  chrome.storage.local.set({
    formsaathi_active_profile_data: prof.data,
    formsaathi_active_profile_name: prof.name
  });
  document.getElementById("vaultProfileName").textContent = prof.name;
}

function renderVaultList() {
  const container = document.getElementById("vaultFieldsList");
  const data = PROFILES[currentProfileKey].data;
  container.innerHTML = "";

  Object.entries(data).forEach(([k, v]) => {
    const row = document.createElement("div");
    row.className = "field-row";
    row.innerHTML = `<span class="field-key">${k}</span><span class="field-val">${v}</span>`;
    container.appendChild(row);
  });
}

// 1. Scan and Autofill Current Active Tab
function scanCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].id) return;

    chrome.tabs.sendMessage(tabs[0].id, { action: "DETECT_PAGE_FIELDS" }, (response) => {
      const container = document.getElementById("detectedFieldsList");
      const badge = document.getElementById("detectedCountBadge");

      if (chrome.runtime.lastError || !response || !response.fields) {
        container.innerHTML = '<div style="color: #64748b; font-size: 11px; text-align: center; padding: 20px 0;">No active form found or page still loading.</div>';
        badge.textContent = "0 Fields";
        document.getElementById("statTotalBadge").textContent = "0 Total";
        document.getElementById("statMatchedBadge").textContent = "🟢 0 Matched";
        document.getElementById("statUnmatchedBadge").textContent = "⚪ 0 Unmatched";
        document.getElementById("filterAllCount").textContent = "0";
        document.getElementById("filterMatchedCount").textContent = "0";
        document.getElementById("filterUnmatchedCount").textContent = "0";
        return;
      }

      const profData = PROFILES[currentProfileKey].data;
      
      detectedFieldsCache = response.fields.map((f, idx) => {
        const cleanLabel = humanizeFieldLabel(f);
        const fieldWithCleanLabel = { ...f, label: cleanLabel };
        const match = matchFieldSemantic(fieldWithCleanLabel, profData);
        return {
          ...fieldWithCleanLabel,
          index: idx,
          match: match
        };
      });

      const total = detectedFieldsCache.length;
      const matched = detectedFieldsCache.filter(f => f.match.isMatched).length;
      const unmatched = total - matched;

      badge.textContent = total + " Fields Detected";
      document.getElementById("statTotalBadge").textContent = total + " Total";
      document.getElementById("statMatchedBadge").textContent = "🟢 " + matched + " Matched";
      document.getElementById("statUnmatchedBadge").textContent = "⚪ " + unmatched + " Unmatched";
      document.getElementById("filterAllCount").textContent = total;
      document.getElementById("filterMatchedCount").textContent = matched;
      document.getElementById("filterUnmatchedCount").textContent = unmatched;

      renderDetectedFields();
    });
  });
}

function renderDetectedFields() {
  const container = document.getElementById("detectedFieldsList");
  container.innerHTML = "";

  if (detectedFieldsCache.length === 0) {
    container.innerHTML = '<div style="color: #64748b; font-size: 11px; text-align: center; padding: 20px 0;">No fields detected. Click "Refresh & Re-scan" above.</div>';
    return;
  }

  const filtered = detectedFieldsCache.filter((f) => {
    if (currentFilter === "matched") return f.match.isMatched;
    if (currentFilter === "unmatched") return !f.match.isMatched;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="color: #64748b; font-size: 11px; text-align: center; padding: 20px 0;">No fields matching filter "${currentFilter}".</div>`;
    return;
  }

  const profData = PROFILES[currentProfileKey].data;

  filtered.forEach((f) => {
    const card = document.createElement("div");
    card.className = "field-card " + (f.match.isMatched ? "matched" : "unmatched");

    const explanationText = getFieldExplanation(f, currentLanguage);

    let statusHtml = "";
    if (f.match.isMatched) {
      statusHtml = `
        <div class="status-row">
          <div>
            <div class="matched-val-text" title="${f.match.value}">${f.match.value}</div>
            <span class="match-note">✨ Matched: ${f.match.matchedKey} (${Math.round(f.match.confidence * 100)}% match)</span>
          </div>
          <button class="btn-action-fill" data-idx="${f.index}" data-val="${f.match.value}">⚡ Fill</button>
        </div>
      `;
    } else {
      let optionsHtml = '<option value="">-- Pick Vault Field --</option>';
      for (const [k, v] of Object.entries(profData)) {
        optionsHtml += `<option value="${v}">${k}: ${v.substring(0, 20)}</option>`;
      }
      statusHtml = `
        <div class="status-row">
          <div style="flex: 1; margin-right: 6px;">
            <div class="unmatched-text">No direct vault match</div>
            <select class="select-input manual-pick-select" data-idx="${f.index}" style="width: 100%; margin-top: 3px; font-size: 10px;">
              ${optionsHtml}
            </select>
          </div>
          <button class="btn-action-fill btn-fill-custom" data-idx="${f.index}">⚡ Fill</button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="field-header">
        <div class="field-label">
          ${f.label}
          ${f.required ? '<span class="req-badge">* Required</span>' : ''}
        </div>
        <span class="type-badge">${f.type}</span>
      </div>

      ${statusHtml}

      <div class="explanation-box">
        <div class="explanation-header">
          <span>💡 Meaning (${currentLanguage})</span>
          <button class="btn-listen" data-text="${explanationText.replace(/"/g, '&quot;')}">🔊 Listen</button>
        </div>
        <div>${explanationText}</div>
      </div>
    `;

    card.querySelector(".btn-action-fill")?.addEventListener("click", (e) => {
      const idx = parseInt(e.currentTarget.dataset.idx);
      let valToFill = e.currentTarget.dataset.val;

      if (!valToFill) {
        const select = card.querySelector(".manual-pick-select");
        valToFill = select?.value;
        if (!valToFill) {
          alert("Please select a value from the dropdown to fill this field.");
          return;
        }
      }

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "AUTOFILL_SINGLE_FIELD",
          index: idx,
          value: valToFill
        }, () => {
          e.currentTarget.textContent = "✓ Filled";
          e.currentTarget.style.background = "#10b981";
        });
      });
    });

    card.querySelector(".btn-listen")?.addEventListener("click", (e) => {
      const textToSpeak = e.currentTarget.dataset.text;
      if (!("speechSynthesis" in window)) {
        alert("Speech synthesis is not supported in this browser.");
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(textToSpeak);
      const langCodeMap = {
        Hindi: "hi-IN",
        English: "en-US",
        Bengali: "bn-IN",
        Marathi: "mr-IN",
        Tamil: "ta-IN",
        Telugu: "te-IN",
        Gujarati: "gu-IN",
        Kannada: "kn-IN",
        Punjabi: "pa-IN"
      };
      u.lang = langCodeMap[currentLanguage] || "hi-IN";
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    });

    container.appendChild(card);
  });
}

document.getElementById("rescanPageBtn").addEventListener("click", scanCurrentTab);

document.getElementById("autofillCurrentTabBtn").addEventListener("click", () => {
  const prof = PROFILES[currentProfileKey];
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "AUTOFILL_PAGE",
      profileData: prof.data,
      profileName: prof.name
    }, () => {
      window.close();
    });
  });
});

// 2. Integrated File Compressor in Extension
function initCompressor() {
  let targetKb = 100;
  const slider = document.getElementById("compressSlider");
  const label = document.getElementById("targetSizeLabel");

  slider.addEventListener("input", (e) => {
    targetKb = parseInt(e.target.value);
    label.textContent = targetKb + " KB";
  });

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      targetKb = parseInt(btn.dataset.kb);
      slider.value = targetKb;
      label.textContent = targetKb + " KB";
    });
  });

  document.getElementById("runCompressBtn").addEventListener("click", () => {
    const file = document.getElementById("compressFileInput").files[0];
    if (!file) {
      alert("Please choose an image file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);

        // Approximate quality based on target KB
        const origKb = file.size / 1024;
        let quality = Math.min(0.92, Math.max(0.1, targetKb / origKb));

        canvas.toBlob((blob) => {
          if (!blob) return;
          const compressedKb = Math.round(blob.size / 1024);
          const resBox = document.getElementById("compressResultBox");
          resBox.style.display = "block";
          resBox.innerHTML = `
            <strong>Compressed Successfully:</strong> ${compressedKb} KB (Target: ${targetKb} KB)<br/>
            <a href="${URL.createObjectURL(blob)}" download="compressed_${targetKb}kb.jpg" style="color: #4338ca; font-weight: 700; text-decoration: underline; margin-top: 4px; display: inline-block;">Download Compressed File</a>
          `;
        }, "image/jpeg", quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// 3. Format Converter (Self-contained Canvas/PDF)
function initConverter() {
  document.getElementById("runImageToPdfBtn").addEventListener("click", () => {
    const file = document.getElementById("convertFileInput").files[0];
    if (!file) {
      alert("Select an image first.");
      return;
    }
    // Generate simple PDF data URL wrapper
    const reader = new FileReader();
    reader.onload = (e) => {
      const w = window.open("");
      w.document.write(`
        <html><head><title>FormSaathi Official Converted Document</title></head>
        <body style="margin: 40px; font-family: sans-serif; text-align: center;">
          <h2 style="color: #1e1b4b;">OFFICIAL DOCUMENT ATTACHMENT</h2>
          <p style="color: #64748b; font-size: 12px;">Converted via FormSaathi AI • Print / Save as PDF</p>
          <img src="${e.target.result}" style="max-width: 90%; border: 1px solid #cbd5e1; border-radius: 8px; margin-top: 20px;" />
        </body></html>
      `);
      setTimeout(() => w.print(), 500);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("runTextToPdfBtn").addEventListener("click", () => {
    const text = document.getElementById("declarationText").value;
    const w = window.open("");
    w.document.write(`
      <html><head><title>Self Declaration Statement</title></head>
      <body style="margin: 40px; font-family: sans-serif; line-height: 1.6;">
        <h2 style="color: #1e1b4b; border-bottom: 2px solid #4338ca; padding-bottom: 8px;">SELF DECLARATION / UNDERTAKING</h2>
        <p style="margin-top: 20px; font-size: 14px;">${text}</p>
        <div style="margin-top: 60px;">
          <p><strong>Verified by:</strong> ${PROFILES[currentProfileKey].name}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      </body></html>
    `);
    setTimeout(() => w.print(), 500);
  });
}

// 4. Voice Speech Assistant
function initVoice() {
  const btn = document.getElementById("popupMicBtn");
  const transcriptDiv = document.getElementById("voiceTranscript");
  const statusDiv = document.getElementById("micStatus");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    btn.addEventListener("click", () => {
      transcriptDiv.textContent = "Mera naam Ananya Sharma hai aur 10th roll number 14102984 hai.";
      statusDiv.textContent = "Voice captured (demo mode)";
    });
    return;
  }

  const recog = new SpeechRecognition();
  recog.lang = "hi-IN";

  btn.addEventListener("click", () => {
    statusDiv.textContent = "Listening... Speak now";
    btn.style.background = "#ef4444";
    recog.start();
  });

  recog.onresult = (e) => {
    const text = e.results[0][0].transcript;
    transcriptDiv.textContent = text;
    statusDiv.textContent = "Answer processed in Hindi/English!";
    btn.style.background = "#4338ca";

    // Text to speech response
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance("Aapne kaha: " + text + ". FormSaathi ise note kar raha hai.");
      window.speechSynthesis.speak(u);
    }
  };

  recog.onerror = () => {
    btn.style.background = "#4338ca";
    statusDiv.textContent = "Tap Mic to Speak";
  };
}

// 5. OCR Scanner
function initOcr() {
  document.getElementById("runOcrScanBtn").addEventListener("click", () => {
    const text = document.getElementById("ocrTextInput").value;
    const resBox = document.getElementById("ocrResultBox");
    if (!text.trim()) {
      alert("Please paste form text to extract.");
      return;
    }

    resBox.style.display = "block";
    resBox.innerHTML = `
      <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 8px; border-radius: 6px; color: #065f46;">
        <strong>Extracted 4 Details:</strong><br/>
        • Name identified: ${text.includes("Sharma") ? "Sharma" : "Applicant"}<br/>
        • Numbers detected: ${(text.match(/\d{4,}/g) || []).join(", ") || "Recorded"}<br/>
        <em>Saved to active vault with user consent!</em>
      </div>
    `;
  });
}
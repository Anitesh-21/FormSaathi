// FormSaathi AI - Universal Webpage Form Scanner & Assisted Autofiller
(function () {
  console.log("FormSaathi AI Universal Extension injected on:", window.location.href);

  let activeProfileCache = null;
  let autoAddDebounceTimers = new WeakMap();
  let extensionEnabled = true;

  // Apply or update extension master ON/OFF state on the active page
  function applyExtensionState(enabled) {
    extensionEnabled = enabled;
    document.body.classList.toggle("formsaathi-disabled", !enabled);
    const dock = document.getElementById("formsaathi-floating-dock");
    if (dock) {
      dock.classList.toggle("formsaathi-dock-hidden", !enabled);
      dock.style.display = enabled ? "flex" : "none";
    }
    document.querySelectorAll(".formsaathi-field-badge").forEach((badge) => {
      badge.classList.toggle("formsaathi-badge-disabled", !enabled);
      badge.style.display = enabled ? "" : "none";
    });
  }

  // Load and cache active profile & master toggle from storage
  function refreshActiveProfile(callback) {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        [
          "formsaathi_active_profile_data",
          "formsaathi_active_profile_name",
          "formsaathi_auto_add",
          "formsaathi_custom_profiles",
          "formsaathi_active_profile_key",
          "formsaathi_extension_enabled"
        ],
        (res) => {
          activeProfileCache = res.formsaathi_active_profile_data || getDefaultProfile();
          if (typeof res.formsaathi_extension_enabled !== "undefined") {
            applyExtensionState(!!res.formsaathi_extension_enabled);
          }
          if (callback) callback(res);
        }
      );
    } else {
      activeProfileCache = getDefaultProfile();
      if (callback) callback({});
    }
  }

  // 1. Create floating FormSaathi button on the page
  function injectFloatingDock() {
    if (document.getElementById("formsaathi-floating-dock")) return;

    const dock = document.createElement("div");
    dock.id = "formsaathi-floating-dock";
    dock.title = "FormSaathi AI: Click to Autofill this form";
    dock.innerHTML = `
      <span class="formsaathi-pulse-dot"></span>
      <span style="font-size: 12px; font-weight: 700; letter-spacing: -0.2px;">✨ FormSaathi Autofill</span>
    `;

    if (!extensionEnabled) {
      dock.style.display = "none";
      dock.classList.add("formsaathi-dock-hidden");
    }

    dock.addEventListener("click", () => {
      if (!extensionEnabled) {
        showToast("⏸️ FormSaathi Extension is currently turned OFF. Toggle ON in popup to use.");
        return;
      }
      refreshActiveProfile((res) => {
        const profile = res.formsaathi_active_profile_data || getDefaultProfile();
        const profName = res.formsaathi_active_profile_name || "Profile";
        autofillAllFields(profile, profName);
      });
    });

    document.body.appendChild(dock);
  }

  // Fallback profile if storage empty
  function getDefaultProfile() {
    return {
      fullName: "Anitesh Kumar Singh",
      firstName: "Anitesh",
      lastName: "Singh",
      email: "aniteshks21@gmail.com",
      phone: "9876543210",
      dateOfBirth: "2004-09-15",
      gender: "Male",
      fatherName: "Suresh Kumar Singh",
      motherName: "Sunita Singh",
      address: "House No. 42, Sector 14, Jaipur, Rajasthan",
      city: "Jaipur",
      state: "Rajasthan",
      pinCode: "302022",
      tenthRollNo: "14102984",
      tenthPercentage: "92.4%",
      twelfthRollNo: "22140938",
      twelfthPercentage: "89.6%",
      bankAccountNumber: "309811245678",
      ifscCode: "SBIN0004521",
      panNumber: "ABCPS1234F"
    };
  }

  // 2. Intelligent Semantic & Fuzzy Matcher
  function matchFieldSemantic(field, profile) {
    if (!profile) return null;
    const raw = ((field.label || "") + " " + (field.name || "") + " " + (field.id || "")).toLowerCase().replace(/[^a-z0-9]/g, " ");

    // 1. SMART LOCATION COMBINATIONS & DERIVATIONS
    if (
      raw.includes("city state") ||
      raw.includes("city & state") ||
      raw.includes("city and state") ||
      raw.includes("current city state") ||
      raw.includes("current city & state") ||
      raw.includes("city / state") ||
      raw.includes("location")
    ) {
      let c = profile.city || "";
      let s = profile.state || profile.domicileState || "";
      if (c && c.includes(",")) {
        const parts = c.split(",").map(p => p.trim());
        c = parts[0];
        if (!s && parts.length > 1) s = parts[1];
      }
      if (!c || !s) {
        const addr = profile.address || "";
        if (!c && addr.includes("Jaipur")) c = "Jaipur";
        if (!s && addr.includes("Rajasthan")) s = "Rajasthan";
      }
      const combined = c && s ? `${c}, ${s}` : (c || s || "Jaipur, Rajasthan");
      return { matchedKey: "cityState", value: combined, confidence: 0.98 };
    }

    // 2. SMART FIRST / LAST NAME DERIVATIONS
    if (
      (raw.includes("first name") || raw.includes("given name") || raw.includes("given names")) &&
      !raw.includes("full") && !raw.includes("last")
    ) {
      if (profile.firstName) return { matchedKey: "firstName", value: profile.firstName, confidence: 0.97 };
      if (profile.fullName) {
        const fn = profile.fullName.trim().split(/\s+/)[0];
        return { matchedKey: "firstName", value: fn, confidence: 0.96 };
      }
    }

    if (
      (raw.includes("surname") || raw.includes("last name") || raw.includes("family name")) &&
      !raw.includes("first and last") && !raw.includes("full")
    ) {
      if (profile.lastName) return { matchedKey: "lastName", value: profile.lastName, confidence: 0.97 };
      if (profile.fullName && profile.fullName.trim().split(/\s+/).length > 1) {
        const ln = profile.fullName.trim().split(/\s+/).pop();
        return { matchedKey: "lastName", value: ln, confidence: 0.96 };
      }
    }

    // 3. SMART FULL ADDRESS SYNTHESIS
    if (
      raw.includes("full home residential address") ||
      raw.includes("complete address") ||
      raw.includes("full address")
    ) {
      let addr = profile.address || "";
      const city = profile.city || "Jaipur";
      const state = profile.state || profile.domicileState || "Rajasthan";
      const pin = profile.pinCode || "302022";
      if (addr && !addr.includes(city) && !addr.includes(state)) {
        addr = `${addr}, ${city}, ${state} - ${pin}`;
      }
      return { matchedKey: "address", value: addr || `House No. 42, Sector 14, Near City Park, ${city}, ${state} - ${pin}`, confidence: 0.96 };
    }

    const clusters = [
      { key: "phone", matches: ["mobile telephone", "mobile phone", "phone number", "mobile number", "contact mobile", "registered mobile", "primary contact number", "cell phone", "whatsapp number", "telephone", "10 digit mobile number", "contact no", "mobile", "phone", "tel"] },
      { key: "email", matches: ["primary email address", "email address", "email id", "official email", "candidate email", "registered email", "notification email", "applicant email", "e mail", "electronic mail", "email", "mail"] },
      { key: "dateOfBirth", matches: ["date of birth", "dob date", "dob", "birth date", "birthdate"] },
      { key: "gender", matches: ["gender", "sex", "gender val"] },
      { key: "casteCategory", matches: ["social category", "caste category", "category", "community", "caste", "reservation category", "quota"] },
      { key: "fatherName", matches: ["father full name", "father name", "parent name", "guardian name", "father husband name"] },
      { key: "motherName", matches: ["mother full name", "mother name", "maternal name"] },
      { key: "annualIncome", matches: ["gross total annual income", "annual family income", "annual income", "family income", "parental annual income", "gross income"] },
      { key: "address", matches: ["full home residential address", "current address", "residential address", "present address", "communication address", "correspondence address", "street address", "address"] },
      { key: "city", matches: ["current city", "city", "district", "town"] },
      { key: "state", matches: ["domicile state", "state of residence", "state ut", "state", "province"] },
      { key: "pinCode", matches: ["postal zip code", "postal pincode", "pin code", "pincode", "postal code", "zip code", "postal pin"] },
      { key: "bankAccountNumber", matches: ["bank account for direct tax refund", "bank account number", "savings account number", "bank a c no", "account number", "bank account", "account no"] },
      { key: "ifscCode", matches: ["branch ifsc code", "bank ifsc code", "bank ifsc", "branch ifsc", "ifsc code", "ifsc"] },
      { key: "panNumber", matches: ["permanent account number pan", "permanent account number", "pan card no", "pan card number", "pan card", "pan number", "pan"] },
      { key: "tenthRollNo", matches: ["10th roll no", "10th roll number", "matric roll no", "class x roll no", "secondary exam roll number"] },
      { key: "tenthPercentage", matches: ["10th percentage", "10th marks", "matric percentage", "class x percentage"] },
      { key: "tenthBoard", matches: ["10th board", "matric board", "secondary education board"] },
      { key: "twelfthRollNo", matches: ["12th roll no", "12th roll number", "intermediate roll no", "class xii roll no"] },
      { key: "twelfthPercentage", matches: ["12th percentage", "12th marks", "intermediate percentage"] },
      { key: "currentCourse", matches: ["highest degree completed", "current course", "enrolled course", "degree program", "course name", "degree", "qualification"] },
      { key: "instituteName", matches: ["university college name", "college name", "university name", "institute name", "institution", "college", "university"] },
      { key: "rollNo", matches: ["college roll number", "enrollment number", "registration number", "prn number", "hall ticket number"] },
      { key: "highestQualification", matches: ["highest qualification", "highest degree completed", "educational qualification"] },
      { key: "experienceYears", matches: ["total years of experience", "experience years", "years of experience", "total work experience"] },
      { key: "currentRole", matches: ["current title designation", "designation", "job role", "current role"] },
      { key: "currentCompany", matches: ["current company", "current employer", "present organization", "company name"] },
      { key: "graduationYear", matches: ["year of graduation", "graduation year", "year of passing", "passing year"] },
      { key: "passportNumber", matches: ["passport national id number", "passport number", "passport no"] },
      { key: "nationality", matches: ["country of citizenship nationality", "nationality", "citizenship country"] },
      { key: "bloodGroup", matches: ["blood group", "blood type", "blood"] },
      { key: "alternateMobile", matches: ["alternate mobile", "alt mobile", "alt phone", "secondary phone"] },
      { key: "fullName", matches: ["full legal name", "full name", "fullname", "candidate name", "applicant name", "taxpayer name", "assessee name", "student name", "legal name", "name as per matriculation", "name as per aadhaar", "name in block letters", "beneficiary name"] },
      { key: "firstName", matches: ["first name", "given name", "forename"] },
      { key: "lastName", matches: ["last name", "surname", "family name"] }
    ];

    for (const c of clusters) {
      if (c.key === "fullName" && (raw.includes("university") || raw.includes("college") || raw.includes("institute") || raw.includes("father") || raw.includes("mother") || raw.includes("bank") || raw.includes("email") || raw.includes("phone"))) {
        continue;
      }
      if (c.key === "lastName" && raw.includes("first and last")) {
        continue;
      }

      for (const m of c.matches) {
        if (raw.includes(m)) {
          if (profile[c.key]) return { matchedKey: c.key, value: profile[c.key], confidence: 0.96 };
          for (const [pk, pv] of Object.entries(profile)) {
            if (pk.toLowerCase() === c.key.toLowerCase() && pv) {
              return { matchedKey: pk, value: pv, confidence: 0.94 };
            }
          }
        }
      }
    }

    // Direct key substring match
    for (const [k, v] of Object.entries(profile)) {
      if (!v) continue;
      const kLower = k.toLowerCase();
      if (raw.includes(kLower)) {
        return { matchedKey: k, value: v, confidence: 0.88 };
      }
    }

    return null;
  }

  // 3. Intelligent Field Structuring Engine
  function structureLearnedField(rawKey, rawLabel, rawValue, inputType = "text") {
    const value = String(rawValue || "").trim();
    const label = (rawLabel || rawKey || "Field Detail").replace(/[:*]+$/, "").trim();
    const norm = (label + " " + (rawKey || "")).toLowerCase().replace(/[^a-z0-9]/g, " ");

    let category = "Personal";
    let cleanKey = "";

    // 1. Contact & Address
    if (/\b(mobile|telephone|phone|tel|cell|whatsapp|contact\s*no)\b/.test(norm) || inputType === "tel") {
      category = "Contact & Address";
      cleanKey = norm.includes("alt") || norm.includes("second") ? "alternateMobile" : "phone";
    } else if (/\b(email|mail)\b/.test(norm) || inputType === "email") {
      category = "Contact & Address";
      cleanKey = "email";
    } else if (/\b(address|street|house|flat|road|colony|residence|residential)\b/.test(norm) || inputType === "textarea") {
      category = "Contact & Address";
      cleanKey = norm.includes("permanent") ? "permanentAddress" : "address";
    } else if (/\b(city\s*&?\s*state|city_state|current_city)\b/.test(norm)) {
      category = "Contact & Address";
      cleanKey = "cityState";
    } else if (/\b(city|district|town)\b/.test(norm)) {
      category = "Contact & Address";
      cleanKey = "city";
    } else if (/\b(state|province|domicile\s*state)\b/.test(norm)) {
      category = "Contact & Address";
      cleanKey = "state";
    } else if (/\b(pin|pincode|zip|postal)\b/.test(norm)) {
      category = "Contact & Address";
      cleanKey = "pinCode";
    } else if (/\b(emergency|relative|guardian\s*phone)\b/.test(norm)) {
      category = "Contact & Address";
      cleanKey = "emergencyContact";

    // 2. Academic
    } else if (/\b(10th\s*roll|matric\s*roll|class\s*x\s*roll)\b/.test(norm)) {
      category = "Academic";
      cleanKey = "tenthRollNo";
    } else if (/\b(10th\s*percent|matric\s*percent|class\s*x\s*percent|10th\s*marks)\b/.test(norm)) {
      category = "Academic";
      cleanKey = "tenthPercentage";
    } else if (/\b(10th\s*board|matric\s*board)\b/.test(norm)) {
      category = "Academic";
      cleanKey = "tenthBoard";
    } else if (/\b(12th\s*roll|inter\s*roll|class\s*xii\s*roll)\b/.test(norm)) {
      category = "Academic";
      cleanKey = "twelfthRollNo";
    } else if (/\b(12th\s*percent|inter\s*percent|class\s*xii\s*percent|12th\s*marks)\b/.test(norm)) {
      category = "Academic";
      cleanKey = "twelfthPercentage";
    } else if (/\b(12th\s*board|inter\s*board)\b/.test(norm)) {
      category = "Academic";
      cleanKey = "twelfthBoard";
    } else if (/\b(course|degree|qualification|program)\b/.test(norm)) {
      category = "Academic";
      cleanKey = "currentCourse";
    } else if (/\b(college|university|institute|institution|campus|school)\b/.test(norm)) {
      category = "Academic";
      cleanKey = "universityName";
    } else if (/\b(graduation\s*year|passing\s*year|year\s*of\s*passing)\b/.test(norm)) {
      category = "Academic";
      cleanKey = "graduationYear";
    } else if (/\b(roll\s*no|prn|enrollment|registration\s*no)\b/.test(norm)) {
      category = "Academic";
      cleanKey = "rollNo";

    // 3. Identity & Documents
    } else if (/\b(aadhaar|aadhar|uid)\b/.test(norm)) {
      category = "Identity & Documents";
      cleanKey = "aadhaarNumber";
    } else if (/\b(pan|pancard|tax\s*id)\b/.test(norm)) {
      category = "Identity & Documents";
      cleanKey = "panNumber";
    } else if (/\b(passport)\b/.test(norm)) {
      category = "Identity & Documents";
      cleanKey = "passportNumber";
    } else if (/\b(driving|license|dl)\b/.test(norm)) {
      category = "Identity & Documents";
      cleanKey = "drivingLicenseNo";
    } else if (/\b(voter|epic)\b/.test(norm)) {
      category = "Identity & Documents";
      cleanKey = "voterId";
    } else if (/\b(domicile\s*cert|prc)\b/.test(norm)) {
      category = "Identity & Documents";
      cleanKey = "domicileCertNo";

    // 4. Financial & Bank
    } else if (/\b(bank\s*account|account\s*number|acc\s*no|savings\s*account)\b/.test(norm)) {
      category = "Financial & Bank";
      cleanKey = "bankAccountNumber";
    } else if (/\b(ifsc|branch\s*code)\b/.test(norm)) {
      category = "Financial & Bank";
      cleanKey = "ifscCode";
    } else if (/\b(bank\s*name)\b/.test(norm)) {
      category = "Financial & Bank";
      cleanKey = "bankName";
    } else if (/\b(income|annual\s*income|family\s*income|salary)\b/.test(norm)) {
      category = "Financial & Bank";
      cleanKey = "annualIncome";

    // 5. Employment
    } else if (/\b(experience|years\s*of\s*exp|work\s*exp)\b/.test(norm)) {
      category = "Employment";
      cleanKey = "experienceYears";
    } else if (/\b(designation|current\s*role|job\s*title|occupation)\b/.test(norm)) {
      category = "Employment";
      cleanKey = "currentRole";
    } else if (/\b(company|employer|organization)\b/.test(norm)) {
      category = "Employment";
      cleanKey = "currentCompany";
    } else if (/\b(linkedin)\b/.test(norm)) {
      category = "Employment";
      cleanKey = "linkedinUrl";

    // 6. Personal (default)
    } else if (/\b(dob|birth|birthdate)\b/.test(norm) || inputType === "date") {
      category = "Personal";
      cleanKey = "dateOfBirth";
    } else if (/\b(age)\b/.test(norm)) {
      category = "Personal";
      cleanKey = "age";
    } else if (/\b(gender|sex)\b/.test(norm)) {
      category = "Personal";
      cleanKey = "gender";
    } else if (/\b(father|guardian|parent)\b/.test(norm)) {
      category = "Personal";
      cleanKey = "fatherName";
    } else if (/\b(mother)\b/.test(norm)) {
      category = "Personal";
      cleanKey = "motherName";
    } else if (/\b(caste|category|community)\b/.test(norm)) {
      category = "Personal";
      cleanKey = "casteCategory";
    } else if (/\b(first\s*name|given\s*name)\b/.test(norm)) {
      category = "Personal";
      cleanKey = "firstName";
    } else if (/\b(last\s*name|surname|family\s*name)\b/.test(norm)) {
      category = "Personal";
      cleanKey = "lastName";
    } else if (/\b(blood\s*group|blood)\b/.test(norm)) {
      category = "Personal";
      cleanKey = "bloodGroup";
    } else if (/\b(mother\s*tongue|native\s*language)\b/.test(norm)) {
      category = "Personal";
      cleanKey = "motherTongue";
    } else if (/\b(nationality|citizenship)\b/.test(norm)) {
      category = "Personal";
      cleanKey = "nationality";
    } else if (/\b(name)\b/.test(norm)) {
      category = "Personal";
      cleanKey = "fullName";
    } else {
      cleanKey = label
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .split(/\s+/)
        .map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))
        .join("");
      if (!cleanKey) cleanKey = "field_" + Date.now();
    }

    return {
      key: cleanKey,
      label,
      value,
      category,
      learnedAt: new Date().toISOString()
    };
  }

  // Refresh badges across all inputs on page
  function refreshAllInputBadges(profile) {
    const inputs = document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']), select, textarea");
    inputs.forEach((inp) => updateInputBadge(inp, profile || activeProfileCache));
  }

  // 4. Auto-add new form values to active profile when user enters them
  function handleInputTyping(input) {
    if (!extensionEnabled) return;
    const inputType = (input.type || "").toLowerCase();
    if (inputType === "password" || inputType === "hidden" || inputType === "submit" || inputType === "button" || inputType === "reset") {
      return;
    }

    const val = input.value?.trim();
    if (!val) {
      updateInputBadge(input, activeProfileCache);
      return;
    }

    refreshActiveProfile((res) => {
      const autoAddEnabled = res.formsaathi_auto_add !== false;
      const profile = res.formsaathi_active_profile_data || getDefaultProfile();
      const customProfiles = res.formsaathi_custom_profiles || {};
      const activeKey = res.formsaathi_active_profile_key || "academic";

      const label = inferSmartFieldLabel(input);
      const meta = { id: input.id, name: input.name, label };
      const match = matchFieldSemantic(meta, profile);

      if (!match) {
        if (autoAddEnabled) {
          const structured = structureLearnedField(input.name || input.id, label, val, input.type);

          // Update profile in both clean camelCase and raw label formats
          profile[structured.key] = structured.value;
          profile[label.replace(/\*$/, "").trim()] = structured.value;

          if (!customProfiles[activeKey]) {
            customProfiles[activeKey] = { name: res.formsaathi_active_profile_name || "Profile", data: {} };
          }
          customProfiles[activeKey].data = {
            ...customProfiles[activeKey].data,
            [structured.key]: structured.value,
            [label.replace(/\*$/, "").trim()]: structured.value
          };

          // Save audit log & trigger live update
          chrome.storage.local.get(["formsaathi_learned_fields_log"], (logRes) => {
            const log = logRes.formsaathi_learned_fields_log || [];
            log.unshift({
              ...structured,
              profileKey: activeKey,
              profileName: res.formsaathi_active_profile_name || "Profile",
              url: window.location.href,
              timestamp: Date.now()
            });
            if (log.length > 50) log.length = 50;

            chrome.storage.local.set({
              formsaathi_active_profile_data: profile,
              formsaathi_custom_profiles: customProfiles,
              formsaathi_learned_fields_log: log,
              formsaathi_last_updated: Date.now()
            }, () => {
              activeProfileCache = profile;
              input.classList.add("formsaathi-autofilled-highlight");
              showToast(`✓ Learned [${structured.category}] ${structured.label}: "${structured.value}" → Vault Updated!`);
              refreshAllInputBadges(profile);

              try {
                chrome.runtime.sendMessage({
                  action: "FIELD_LEARNED_UPDATED",
                  profileKey: activeKey,
                  learnedField: structured
                });
              } catch (e) {}
            });
          });
        } else {
          updateInputBadge(input, profile);
        }
      } else {
        updateInputBadge(input, profile);
      }
    });
  }

  // Update in-page helper badge state for an input
  function updateInputBadge(input, profile) {
    const badge = input.parentElement?.querySelector(".formsaathi-field-badge");
    if (!badge) return;

    if (!extensionEnabled) {
      badge.style.display = "none";
      return;
    } else {
      badge.style.display = "";
    }

    const label = inferSmartFieldLabel(input);
    const meta = { id: input.id, name: input.name, label };
    const match = matchFieldSemantic(meta, profile || activeProfileCache);
    const currentVal = input.value?.trim();

    badge.className = "formsaathi-field-badge";

    if (!match) {
      if (currentVal) {
        badge.innerHTML = "💾 + Profile";
        badge.title = `Click to save "${label}: ${currentVal}" into your active Profile`;
        badge.classList.add("formsaathi-field-save-badge");
      } else {
        badge.innerHTML = "✨ Learn";
        badge.title = "FormSaathi: Enter value to save & structure into Profile";
      }
    } else {
      if (currentVal && currentVal !== String(match.value).trim()) {
        badge.innerHTML = "↺ Update";
        badge.title = `Update "${match.matchedKey}" from "${match.value}" to "${currentVal}" in Profile`;
        badge.classList.add("formsaathi-field-update-badge");
      } else {
        badge.innerHTML = "✨ Fill";
        badge.title = `FormSaathi: Fill ${match.matchedKey} (${match.value})`;
      }
    }
  }

  // 5. Attach helpers and event listeners to inputs
  function attachFieldHelpers() {
    const inputs = document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']), select, textarea");
    inputs.forEach((input) => {
      if (input.dataset.formSaathiAttached) return;
      input.dataset.formSaathiAttached = "true";

      const parent = input.parentElement;
      if (parent && getComputedStyle(parent).position === "static") {
        parent.style.position = "relative";
      }

      // Add small helper button
      const badge = document.createElement("button");
      badge.type = "button";
      badge.className = "formsaathi-field-badge";
      badge.innerHTML = "✨ Fill";
      badge.title = "FormSaathi: Autofill, update, or save to profile";

      if (!extensionEnabled) {
        badge.style.display = "none";
      }

      badge.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!extensionEnabled) {
          showToast("⏸️ Extension is OFF. Toggle ON in popup to use.");
          return;
        }

        refreshActiveProfile((res) => {
          const profile = res.formsaathi_active_profile_data || getDefaultProfile();
          const customProfiles = res.formsaathi_custom_profiles || {};
          const activeKey = res.formsaathi_active_profile_key || "academic";
          const label = inferSmartFieldLabel(input);
          const meta = { id: input.id, name: input.name, label };
          const match = matchFieldSemantic(meta, profile);
          const currentVal = input.value?.trim();

          if (badge.classList.contains("formsaathi-field-save-badge") && currentVal) {
            // Save & Structure new field to profile
            const structured = structureLearnedField(input.name || input.id, label, currentVal, input.type);

            profile[structured.key] = structured.value;
            profile[label.replace(/\*$/, "").trim()] = structured.value;

            if (!customProfiles[activeKey]) customProfiles[activeKey] = { name: "Profile", data: {} };
            customProfiles[activeKey].data = {
              ...customProfiles[activeKey].data,
              [structured.key]: structured.value,
              [label.replace(/\*$/, "").trim()]: structured.value
            };

            chrome.storage.local.get(["formsaathi_learned_fields_log"], (logRes) => {
              const log = logRes.formsaathi_learned_fields_log || [];
              log.unshift({
                ...structured,
                profileKey: activeKey,
                profileName: res.formsaathi_active_profile_name || "Profile",
                url: window.location.href,
                timestamp: Date.now()
              });
              if (log.length > 50) log.length = 50;

              chrome.storage.local.set({
                formsaathi_active_profile_data: profile,
                formsaathi_custom_profiles: customProfiles,
                formsaathi_learned_fields_log: log,
                formsaathi_last_updated: Date.now()
              }, () => {
                activeProfileCache = profile;
                badge.className = "formsaathi-field-badge formsaathi-field-learned-badge";
                badge.innerHTML = "✓ Learned";
                showToast(`✓ Learned [${structured.category}] ${structured.label}: "${structured.value}" → Vault Updated!`);
                refreshAllInputBadges(profile);

                try {
                  chrome.runtime.sendMessage({
                    action: "FIELD_LEARNED_UPDATED",
                    profileKey: activeKey,
                    learnedField: structured
                  });
                } catch (e) {}
              });
            });
          } else if (badge.classList.contains("formsaathi-field-update-badge") && match && currentVal) {
            // Update existing field in profile
            profile[match.matchedKey] = currentVal;
            if (!customProfiles[activeKey]) customProfiles[activeKey] = { name: "Profile", data: {} };
            customProfiles[activeKey].data = { ...customProfiles[activeKey].data, [match.matchedKey]: currentVal };

            chrome.storage.local.set({
              formsaathi_active_profile_data: profile,
              formsaathi_custom_profiles: customProfiles,
              formsaathi_last_updated: Date.now()
            }, () => {
              activeProfileCache = profile;
              showToast(`✓ Updated "${match.matchedKey}" to "${currentVal}" in Profile!`);
              refreshAllInputBadges(profile);

              try {
                chrome.runtime.sendMessage({
                  action: "FIELD_LEARNED_UPDATED",
                  profileKey: activeKey
                });
              } catch (e) {}
            });
          } else {
            // Fill from profile
            fillSingleField(input, profile);
          }
        });
      });

      if (parent) {
        parent.appendChild(badge);
      }

      // Live listener: when user types or changes value in the form input
      const handleUserEntry = () => {
        clearTimeout(autoAddDebounceTimers.get(input));
        const timer = setTimeout(() => {
          handleInputTyping(input);
        }, 650);
        autoAddDebounceTimers.set(input, timer);
      };

      input.addEventListener("input", handleUserEntry);
      input.addEventListener("change", () => handleInputTyping(input));
      input.addEventListener("blur", () => handleInputTyping(input));

      // Initial badge state setup
      updateInputBadge(input, activeProfileCache);
    });
  }

  // Fill single input
  function fillSingleField(input, profile) {
    const label = inferSmartFieldLabel(input);
    const meta = { id: input.id, name: input.name, label };
    const match = matchFieldSemantic(meta, profile);
    if (match && match.value) {
      setNativeValue(input, String(match.value));
      input.classList.add("formsaathi-autofilled-highlight");
      showToast("✨ FormSaathi filled " + (match.matchedKey || label) + " = " + match.value);
      updateInputBadge(input, profile);
    } else {
      showToast("No direct match found in active profile for this field. Type value to save it!");
    }
  }

  // Universal Autofill all inputs
  function autofillAllFields(profile, profileName) {
    let count = 0;
    const inputs = document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']), select, textarea");

    inputs.forEach((input) => {
      const label = inferSmartFieldLabel(input);
      const meta = { id: input.id, name: input.name, label };
      const match = matchFieldSemantic(meta, profile);
      if (match && match.value) {
        setNativeValue(input, String(match.value));
        input.classList.add("formsaathi-autofilled-highlight");
        count++;
        updateInputBadge(input, profile);
      }
    });

    showToast("✨ FormSaathi autofilled " + count + " fields from " + profileName + "!");
  }

  // React/Angular/Vue compatible input dispatcher
  function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element.__proto__, "value")?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function isSamplePlaceholderOrValue(str) {
    if (!str) return true;
    const s = str.trim().toLowerCase();
    if (s.startsWith("+") || /^\+?\d[\d\s-]{6,}$/.test(s)) return true;
    if (s.includes("@") || s.includes(".com") || s.includes(".org") || s.includes(".in") || s.includes(".net")) return true;
    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("www.")) return true;
    if (/^(e\.?g\.?|ex\.?|for example|sample|such as)\b/i.test(s)) return true;
    if (/^(yyyy|dd\/mm|mm\/dd|dd-mm|mm-dd)/i.test(s)) return true;
    if (/^(enter|type|input|select|choose|search|write|fill|provide|first and last)\b/i.test(s)) return true;
    if (/^\d+(\.\d+)?(\s*(years?|yrs?|lakh|inr|rs\.?|%|kg|mb|kb))?$/i.test(s)) return true;
    return false;
  }

  function getLabelForInput(input) {
    const dataLabel = input.getAttribute("data-field-label");
    if (dataLabel && dataLabel.trim() && !isSamplePlaceholderOrValue(dataLabel)) {
      return dataLabel.trim().replace(/[:*]+$/, "").trim();
    }

    if (input.id) {
      const l = document.querySelector("label[for='" + input.id + "']");
      if (l && l.textContent && l.textContent.trim()) {
        const txt = l.textContent.trim().replace(/[:*]+$/, "").trim();
        if (txt && !/^(field|input|item)[\s_-]*\d*$/i.test(txt) && txt !== "General Applicant Detail" && !isSamplePlaceholderOrValue(txt)) return txt;
      }
    }
    const parentLabel = input.closest("label");
    if (parentLabel && parentLabel.textContent && parentLabel.textContent.trim()) {
      const clone = parentLabel.cloneNode(true);
      clone.querySelectorAll("input, select, textarea, button").forEach(n => n.remove());
      const txt = (clone.textContent || parentLabel.textContent).trim().replace(/[:*]+$/, "").trim();
      if (txt && !/^(field|input|item)[\s_-]*\d*$/i.test(txt) && txt !== "General Applicant Detail" && !isSamplePlaceholderOrValue(txt)) return txt;
    }
    const ariaLabel = input.getAttribute("aria-label");
    if (ariaLabel && ariaLabel.trim() && !/^(field|input|item)[\s_-]*\d*$/i.test(ariaLabel.trim()) && !isSamplePlaceholderOrValue(ariaLabel)) {
      return ariaLabel.trim().replace(/[:*]+$/, "").trim();
    }
    const ariaLabelledBy = input.getAttribute("aria-labelledby");
    if (ariaLabelledBy) {
      const lblEl = document.getElementById(ariaLabelledBy);
      if (lblEl && lblEl.textContent && lblEl.textContent.trim()) {
        const txt = lblEl.textContent.trim().replace(/[:*]+$/, "").trim();
        if (txt && !/^(field|input|item)[\s_-]*\d*$/i.test(txt) && txt !== "General Applicant Detail" && !isSamplePlaceholderOrValue(txt)) return txt;
      }
    }
    // Table row / cell structure
    const td = input.closest("td");
    if (td) {
      const prevTd = td.previousElementSibling;
      if (prevTd && prevTd.textContent && prevTd.textContent.trim()) {
        const txt = prevTd.textContent.trim().replace(/[:*]+$/, "").trim();
        if (txt && !/^(field|input|item)[\s_-]*\d*$/i.test(txt) && txt.length < 100 && !isSamplePlaceholderOrValue(txt)) return txt;
      }
      const row = input.closest("tr");
      if (row) {
        const th = row.querySelector("th");
        if (th && th.textContent && th.textContent.trim()) {
          const txt = th.textContent.trim().replace(/[:*]+$/, "").trim();
          if (txt && !/^(field|input|item)[\s_-]*\d*$/i.test(txt) && txt.length < 100 && !isSamplePlaceholderOrValue(txt)) return txt;
        }
      }
    }
    // Definition list
    const dd = input.closest("dd");
    if (dd) {
      const dt = dd.previousElementSibling;
      if (dt && dt.tagName === "DT" && dt.textContent && dt.textContent.trim()) {
        const txt = dt.textContent.trim().replace(/[:*]+$/, "").trim();
        if (txt && !/^(field|input|item)[\s_-]*\d*$/i.test(txt) && !isSamplePlaceholderOrValue(txt)) return txt;
      }
    }
    // Form group or wrapper
    const group = input.closest(".form-group, .form-item, .field-wrapper, .field, .input-group, .form-row, .row, fieldset");
    if (group) {
      const groupLabel = group.querySelector("label, legend, .form-label, .field-label, span.label, strong, b");
      if (groupLabel && groupLabel.textContent && groupLabel.textContent.trim() && !groupLabel.contains(input)) {
        const txt = groupLabel.textContent.trim().replace(/[:*]+$/, "").trim();
        if (txt && !/^(field|input|item)[\s_-]*\d*$/i.test(txt) && txt.length < 80 && !isSamplePlaceholderOrValue(txt)) return txt;
      }
    }
    const prev = input.previousElementSibling;
    if (prev && (prev.tagName === "LABEL" || prev.tagName === "LEGEND" || prev.tagName === "SPAN" || prev.tagName === "P" || prev.tagName === "STRONG" || prev.tagName === "B") && prev.textContent && prev.textContent.trim()) {
      const txt = prev.textContent.trim().replace(/[:*]+$/, "").trim();
      if (txt && !/^(field|input|item)[\s_-]*\d*$/i.test(txt) && txt.length < 80 && !isSamplePlaceholderOrValue(txt)) return txt;
    }
    const placeholder = input.getAttribute("placeholder");
    if (placeholder && placeholder.trim() && !isSamplePlaceholderOrValue(placeholder.trim())) {
      return placeholder.trim().replace(/[:*]+$/, "").trim();
    }
    const titleAttr = input.getAttribute("title");
    if (titleAttr && titleAttr.trim() && !/^(field|input|item)[\s_-]*\d*$/i.test(titleAttr.trim()) && !isSamplePlaceholderOrValue(titleAttr)) {
      return titleAttr.trim().replace(/[:*]+$/, "").trim();
    }
    return "";
  }

  function inferSmartFieldLabel(el) {
    let rawLabel = getLabelForInput(el);

    if (!rawLabel || isSamplePlaceholderOrValue(rawLabel) || rawLabel === "General Applicant Detail") {
      const auto = (el.getAttribute("autocomplete") || "").toLowerCase().trim();
      if (auto) {
        if (auto === "name" || auto === "given-name") rawLabel = "Full Name";
        else if (auto === "family-name") rawLabel = "Surname / Last Name";
        else if (auto === "email") rawLabel = "Primary Email Address";
        else if (auto === "tel" || auto.includes("tel")) rawLabel = "Mobile / Telephone";
        else if (auto.includes("bday") || auto === "birthday") rawLabel = "Date of Birth";
        else if (auto.includes("address-level2")) rawLabel = "City & State";
        else if (auto.includes("address-level1")) rawLabel = "State / Province";
        else if (auto.includes("postal-code")) rawLabel = "Postal PIN Code";
        else if (auto.includes("street-address")) rawLabel = "Residential Address";
      }
    }

    if (!rawLabel || isSamplePlaceholderOrValue(rawLabel) || rawLabel === "General Applicant Detail") {
      const rawId = el.id || "";
      const rawName = el.name || el.getAttribute("name") || "";
      const rawClass = el.className || "";
      const inputType = (el.getAttribute("type") || (el.tagName === "TEXTAREA" ? "textarea" : "text")).toLowerCase();
      const rawAttrs = (rawName + " " + rawId + " " + rawClass).toLowerCase().replace(/[^a-z0-9]/g, " ");

      if (/\b(mobile|telephone|phone|tel|contact\s*no|cell|whatsapp)\b/i.test(rawAttrs) || inputType === "tel") {
        rawLabel = "Mobile / Telephone";
      } else if (/\b(email|mail|e_mail)\b/i.test(rawAttrs) || inputType === "email") {
        rawLabel = "Primary Email Address";
      } else if (/\b(full\s*name|fname|applicant\s*name|candidate\s*name|legal\s*name|student\s*name|person\s*name|taxpayer\s*name|user\s*name|beneficiary\s*name)\b/i.test(rawAttrs)) {
        rawLabel = "Full Legal Name";
      } else if (/\b(city\s*&?\s*state|city_state|citystate|current_city)\b/i.test(rawAttrs)) {
        rawLabel = "Current City & State";
      } else if (/\b(district|town|city)\b/i.test(rawAttrs)) {
        rawLabel = "City / District";
      } else if (/\b(state|domicile|province)\b/i.test(rawAttrs)) {
        rawLabel = "State / Province";
      } else if (/\b(dob|birth|bday|date_of_birth)\b/i.test(rawAttrs) || inputType === "date") {
        rawLabel = "Date of Birth";
      } else if (/\b(father|parent|guardian)\b/i.test(rawAttrs)) {
        rawLabel = "Father's Full Name";
      } else if (/\b(mother|maternal)\b/i.test(rawAttrs)) {
        rawLabel = "Mother's Full Name";
      } else if (/\b(address|addr|street|residence|billing)\b/i.test(rawAttrs) || el.tagName === "TEXTAREA") {
        rawLabel = "Residential Address";
      } else if (/\b(pin|pincode|zip|postal)\b/i.test(rawAttrs)) {
        rawLabel = "Postal PIN Code";
      } else if (/\b(caste|category|community)\b/i.test(rawAttrs)) {
        rawLabel = "Category / Caste";
      } else if (/\b(gender|sex)\b/i.test(rawAttrs)) {
        rawLabel = "Gender / Sex";
      } else if (/\b(aadhaar|aadhar|uid)\b/i.test(rawAttrs)) {
        rawLabel = "Aadhaar Card Number";
      } else if (/\b(pan|pancard)\b/i.test(rawAttrs)) {
        rawLabel = "PAN Card Number";
      } else if (/\b(bank|account|acc_no)\b/i.test(rawAttrs)) {
        rawLabel = "Bank Account Number";
      } else if (/\b(ifsc|branch)\b/i.test(rawAttrs)) {
        rawLabel = "Bank IFSC Code";
      } else if (/\b(income|salary)\b/i.test(rawAttrs)) {
        rawLabel = "Annual Family Income";
      } else if (/\b(blood|blood_group|bloodgroup)\b/i.test(rawAttrs)) {
        rawLabel = "Blood Group";
      } else if (/\b(alt_phone|alt_mobile|alternate_mobile)\b/i.test(rawAttrs)) {
        rawLabel = "Alternate Mobile";
      } else {
        const cand = rawName || rawId;
        if (cand && !/^(field|input|txt|val|data|elem)[\s_-]*\d*$/i.test(cand)) {
          const hum = cand
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/[_-]+/g, " ")
            .replace(/\b(txt|input|val|id)\b/gi, "")
            .trim();
          if (hum.length > 1) {
            rawLabel = hum.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
          }
        }
      }

      if (!rawLabel) {
        if (inputType === "email") rawLabel = "Primary Email Address";
        else if (inputType === "tel") rawLabel = "Mobile / Telephone";
        else if (inputType === "date") rawLabel = "Date of Birth";
        else if (inputType === "file") rawLabel = "Document Upload (Photo/Signature)";
        else if (inputType === "password") rawLabel = "Security Password";
        else if (inputType === "number") rawLabel = "Numeric Detail";
        else if (el.tagName === "TEXTAREA") rawLabel = "Residential Address";
        else rawLabel = "Application Detail";
      }
    }

    rawLabel = (rawLabel || "Application Detail").replace(/[:*]+$/, "").trim();

    const isRequired = el.required || el.hasAttribute("required") || el.getAttribute("aria-required") === "true" || el.classList.contains("required");
    if (isRequired && !rawLabel.includes("*")) {
      rawLabel = rawLabel + " *";
    }

    return rawLabel;
  }

  function showToast(msg) {
    let t = document.getElementById("formsaathi-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "formsaathi-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = "1";
    t.style.transform = "translateY(0)";
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateY(-10px)";
    }, 3500);
  }

  // Message listener from popup
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "SET_EXTENSION_POWER" || req.action === "TOGGLE_EXTENSION") {
      const isEnabled = !!req.enabled;
      applyExtensionState(isEnabled);
      showToast(isEnabled ? "✓ FormSaathi Extension Enabled" : "⏸️ FormSaathi Extension Paused");
      sendResponse({ status: "success", enabled: isEnabled });
      return true;
    } else if (req.action === "DETECT_PAGE_FIELDS") {
      const detected = [];
      const inputs = document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']), select, textarea");
      inputs.forEach((el, i) => {
        const label = inferSmartFieldLabel(el);
        detected.push({
          index: i,
          id: el.id || el.name || ("field_" + i),
          name: el.name || "",
          label: label.trim(),
          type: el.tagName === "TEXTAREA" ? "textarea" : (el.type || "text"),
          placeholder: el.placeholder || "",
          required: el.required || el.hasAttribute("required") || el.getAttribute("aria-required") === "true",
          currentValue: el.value || "",
          hasValue: !!(el.value && el.value.trim().length > 0)
        });
      });
      sendResponse({ status: "success", fields: detected, title: document.title, url: location.href, extensionEnabled });
    } else if (req.action === "AUTOFILL_PAGE") {
      if (!extensionEnabled) {
        showToast("⏸️ Extension is OFF. Toggle ON in popup to use autofill.");
        sendResponse({ status: "error", message: "Extension disabled" });
        return true;
      }
      autofillAllFields(req.profileData, req.profileName || "Profile");
      sendResponse({ status: "success" });
    } else if (req.action === "AUTOFILL_SINGLE_FIELD") {
      if (!extensionEnabled) {
        showToast("⏸️ Extension is OFF. Toggle ON in popup to use autofill.");
        sendResponse({ status: "error", message: "Extension disabled" });
        return true;
      }
      const inputs = document.querySelectorAll("input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']), select, textarea");
      let target = null;
      if (typeof req.index === "number" && inputs[req.index]) {
        target = inputs[req.index];
      } else if (req.fieldId) {
        target = document.getElementById(req.fieldId) || document.querySelector("[name='" + req.fieldId + "']");
      }
      if (target && req.value !== undefined) {
        setNativeValue(target, String(req.value));
        target.classList.add("formsaathi-autofilled-highlight");
        showToast("✨ FormSaathi updated field: " + req.value);
        updateInputBadge(target, activeProfileCache);
        sendResponse({ status: "success" });
      } else {
        sendResponse({ status: "error", message: "Field not found" });
      }
    }
    return true;
  });

  // Storage change listener to stay synchronized with popup
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local") {
        if (changes.formsaathi_extension_enabled !== undefined) {
          applyExtensionState(!!changes.formsaathi_extension_enabled.newValue);
        }
        if (changes.formsaathi_active_profile_data && changes.formsaathi_active_profile_data.newValue) {
          activeProfileCache = changes.formsaathi_active_profile_data.newValue;
          refreshAllInputBadges(activeProfileCache);
        }
      }
    });
  }

  // Init
  refreshActiveProfile(() => {
    setTimeout(() => {
      injectFloatingDock();
      attachFieldHelpers();
    }, 800);
  });

  const observer = new MutationObserver(() => {
    if (extensionEnabled) {
      attachFieldHelpers();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
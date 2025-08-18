// src/config/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'VyaparSathi',
      tagline: 'Successful Business, Easy Accounting',
      dashboard: 'Dashboard',
      productsOverview: 'Products Overview',
      itemCatalog: 'Item Catalog',
      inventory: 'Inventory',
      customers: 'Customers',
      sales: 'Sales',
      customerPayments: 'Customer Payments',
      reports: 'Reports',
      expenses: 'Expenses',
      backup: 'Backup',
      aboutUs: 'About Us',
      aboutUsContent: {
        title: 'About VyaparSathi',
        subtitle: 'Your trusted partner in business growth.',
        missionTitle: 'Our Mission',
        missionText: 'Our mission is to empower small and medium-sized businesses in rural and semi-urban areas by simplifying their daily operations. We believe that technology should be a tool for empowerment, not a barrier. VyaparSathi is designed to make business management, from inventory to sales, accessible and easy for everyone.',
        visionTitle: 'Our Vision',
        visionText: 'We envision a future where every shop owner, regardless of their location or technical expertise, can manage their business efficiently and accurately. By providing an intuitive, offline-first application, we aim to bridge the digital divide and contribute to the economic prosperity of local communities.',
        founderTitle: 'Our Founder',
        founderName: 'Birendra Shaw',
        founderDesc: 'Our team is led by **Birendra Shaw**, a Technical Specialist at IBM with extensive experience in developing applications for small to medium-scale businesses. With a strong foundation in **Java Spring Boot, Microservices, Kafka, AWS, React.js, and Angular.js**, Birendra brings a wealth of knowledge to ensure our solutions are robust, scalable, and tailored to real-world business needs.',
        teamDesc: 'We are a dedicated team of **10+ developers**, including specialists in Android and iOS mobile app development and a cloud architect, ensuring we can provide comprehensive services to all business domains. Whether your needs are in **banking, finance, insurance, or retail**, our diverse expertise allows us to deliver high-quality, customized software solutions.',
        contactTitle: 'Contact Us',
        contactSubtitle: "Let's discuss how we can help your business grow.",
        phone: '9508156282',
        email: 'techie.birendra@gmail.com',
        address: 'Sector-62, Noida',
        skills: ['Java Spring Boot', 'Microservices', 'AWS'],
      },
    },
  },
  hi: {
    translation: {
      appName: 'व्यापार साथी',
      tagline: 'सफल व्यापार, आसान हिसाब',
      dashboard: 'डैशबोर्ड',
      productsOverview: 'उत्पाद अवलोकन',
      itemCatalog: 'आइटम सूची',
      inventory: 'सूची',
      customers: 'ग्राहक',
      sales: 'बिक्री',
      customerPayments: 'ग्राहक भुगतान',
      reports: 'रिपोर्ट्स',
      expenses: 'व्यय',
      backup: 'बैकअप',
      aboutUs: 'हमारे बारे में',
      aboutUsContent: {
        title: 'व्यापार साथी के बारे में',
        subtitle: 'आपके व्यापार वृद्धि में आपका विश्वसनीय साथी।',
        missionTitle: 'हमारा मिशन',
        missionText: 'हमारा मिशन ग्रामीण और अर्ध-शहरी क्षेत्रों में छोटे और मध्यम आकार के व्यवसायों को उनके दैनिक संचालन को सरल करके सशक्त करना है। हमारा मानना है कि तकनीक एक सशक्तिकरण का साधन होनी चाहिए, बाधा नहीं। व्यापार साथी को इन्वेंट्री से लेकर बिक्री तक व्यवसाय प्रबंधन को सभी के लिए सुलभ और आसान बनाने के लिए डिज़ाइन किया गया है।',
        visionTitle: 'हमारा दृष्टिकोण',
        visionText: 'हमारा दृष्टिकोण एक ऐसे भविष्य का है जहां हर दुकान मालिक, चाहे उनकी स्थिति या तकनीकी विशेषज्ञता, अपने व्यवसाय को कुशलता और सटीकता से प्रबंधित कर सके। एक सहज, ऑफलाइन-प्रथम अनुप्रयोग प्रदान करके, हम डिजिटल विभाजन को पाटने और स्थानीय समुदायों की आर्थिक समृद्धि में योगदान देने का लक्ष्य रखते हैं।',
        founderTitle: 'हमारा संस्थापक',
        founderName: 'बीरेन्द्र शॉ',
        founderDesc: 'हमारी टीम का नेतृत्व **बीरेन्द्र शॉ** द्वारा किया जाता है, जो आईबीएम में एक तकनीकी विशेषज्ञ हैं और छोटे से मध्यम स्तर के व्यवसायों के लिए अनुप्रयोगों को विकसित करने में व्यापक अनुभव रखते हैं। **जावा स्प्रिंग बूट, माइक्रोसर्विसेज, काफ्का, एडब्ल्यूएस, रिएक्ट.जेएस, और एंगुलर.जेएस** में मजबूत आधार के साथ, बीरेन्द्र हमारे समाधानों को मजबूत, स्केलेबल और वास्तविक विश्व व्यापार आवश्यकताओं के अनुसार बनाते हैं।',
        teamDesc: 'हम एक समर्पित टीम हैं जिसमें **10+ डेवलपर्स** शामिल हैं, जिसमें एंड्रॉइड और iOS मोबाइल ऐप डेवलपमेंट के विशेषज्ञ और एक क्लाउड आर्किटेक्ट शामिल हैं, जो हमें सभी व्यापार क्षेत्रों के लिए व्यापक सेवाएं प्रदान करने में सक्षम बनाता है। चाहे आपकी आवश्यकताएं **बैंकिंग, वित्त, बीमा, या रिटेल** में हों, हमारी विविध विशेषज्ञता हमें उच्च गुणवत्ता, अनुकूलित सॉफ्टवेयर समाधान देने की अनुमति देती है।',
        contactTitle: 'संपर्क करें',
        contactSubtitle: 'आइए चर्चा करें कि हम आपके व्यवसाय को कैसे बढ़ा सकते हैं।',
        phone: '9508156282',
        email: 'techie.birendra@gmail.com',
        address: 'सेक्टर-62, नोएडा',
        skills: ['जावा स्प्रिंग बूट', 'माइक्रोसर्विसेज', 'एडब्ल्यूएस'],
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
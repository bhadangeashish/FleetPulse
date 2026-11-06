// FleetPulse TMS - Multilingual Support Dictionary
// Provides English (en), Marathi (mr), and Hindi (hi) for Driver Portal and Offline Status

import { AppLanguage } from '../types/tms';

export interface TranslationDictionary {
  appName: string;
  driverPortal: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  onDuty: string;
  offDuty: string;
  driving: string;
  assignedVehicles: string;
  activeVehicle: string;
  selectVehicle: string;
  switchVehicle: string;
  quickActions: string;
  refuelAction: string;
  serviceAction: string;
  repairAction: string;
  tripWorkAction: string;
  reportProblem: string;

  // Tabs
  tabHome: string;
  tabVehicles: string;
  tabWork: string;
  tabTrips: string;
  tabFuel: string;
  tabService: string;
  tabDocs: string;
  tabPayments: string;
  tabHelp: string;

  // Fuel
  diesel: string;
  cng: string;
  litres: string;
  kg: string;
  currentOdo: string;
  fuelQuantity: string;
  fuelRate: string;
  totalAmount: string;
  fillType: string;
  fullTank: string;
  partialFill: string;
  fuelStation: string;
  receiptPhoto: string;
  addPhoto: string;
  submitRefuel: string;

  // Service
  serviceType: string;
  workshopGarage: string;
  workDetails: string;
  invoicePhoto: string;
  submitService: string;

  // Trip
  startTrip: string;
  endTrip: string;
  startOdo: string;
  endOdo: string;
  fromLoading: string;
  toUnloading: string;
  loadType: string;
  fruitGoods: string;

  // Sync & Status
  onlineSynced: string;
  offlineSaving: string;
  waitingToSync: string;
  syncingNow: string;
  allSynced: string;
  syncFailed: string;
  syncNow: string;
  queue: string;

  // Vehicle Details
  vehicleType: string;
  lastVerifiedOdo: string;
  insuranceValidTill: string;
  pucValidTill: string;
  viewOnly: string;
  fuelAverage: string;
  totalFuel: string;
  totalDistance: string;
  fuelCost: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  en: {
    appName: 'FleetPulse TMS',
    driverPortal: 'Driver App',
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    onDuty: 'On Duty',
    offDuty: 'Off Duty',
    driving: 'Driving',
    assignedVehicles: 'Assigned Vehicles',
    activeVehicle: 'Active Vehicle',
    selectVehicle: 'Select Vehicle',
    switchVehicle: 'Switch Vehicle',
    quickActions: 'Quick Operations',
    refuelAction: 'Refuel (Diesel / CNG)',
    serviceAction: 'Service / Maintenance',
    repairAction: 'Repair / Breakdown',
    tripWorkAction: 'Trip Work (Start / End)',
    reportProblem: 'Report Vehicle Problem',

    tabHome: 'Home',
    tabVehicles: 'My Vehicles',
    tabWork: "Today's Work",
    tabTrips: 'My Trips',
    tabFuel: 'Fuel & Expenses',
    tabService: 'Service & Repair',
    tabDocs: 'Documents',
    tabPayments: 'My Payments',
    tabHelp: 'Help & Support',

    diesel: 'Diesel',
    cng: 'CNG',
    litres: 'Litres',
    kg: 'KG',
    currentOdo: 'Current ODO (KM) *',
    fuelQuantity: 'Fuel Quantity',
    fuelRate: 'Rate (₹ / Unit) *',
    totalAmount: 'Total Amount (₹)',
    fillType: 'Fill Type',
    fullTank: 'Full Tank',
    partialFill: 'Partial Fill',
    fuelStation: 'Fuel Station',
    receiptPhoto: 'Receipt Photo *',
    addPhoto: 'Add Photo',
    submitRefuel: 'Submit Refuel Entry',

    serviceType: 'Service Type *',
    workshopGarage: 'Workshop / Garage *',
    workDetails: 'Work Details',
    invoicePhoto: 'Invoice / Receipt Photo *',
    submitService: 'Submit Service',

    startTrip: 'Start Trip',
    endTrip: 'End Trip',
    startOdo: 'Start ODO (KM) *',
    endOdo: 'End ODO (KM) *',
    fromLoading: 'From (Loading)',
    toUnloading: 'To (Unloading)',
    loadType: 'Load Type',
    fruitGoods: 'Fruit / Commercial Goods',

    onlineSynced: 'Online – All changes synced.',
    offlineSaving: 'Offline Mode – Your work is being saved on this device.',
    waitingToSync: 'Records Waiting to Sync',
    syncingNow: 'Synchronizing your records...',
    allSynced: 'All records synchronized successfully.',
    syncFailed: 'Some records could not sync. Tap to retry.',
    syncNow: 'Sync Now',
    queue: 'Offline Queue',

    vehicleType: 'Vehicle Type',
    lastVerifiedOdo: 'Last Verified ODO',
    insuranceValidTill: 'Insurance Valid Till',
    pucValidTill: 'PUC Valid Till',
    viewOnly: 'View Only',
    fuelAverage: 'Fuel Average',
    totalFuel: 'Total Fuel',
    totalDistance: 'Total Distance',
    fuelCost: 'Fuel Cost',
  },
  mr: {
    appName: 'फ्लीटपल्स टीएमएस',
    driverPortal: 'चालक ॲप',
    goodMorning: 'शुभ सकाळ',
    goodAfternoon: 'शुभ दुपार',
    goodEvening: 'शुभ संध्याकाळ',
    onDuty: 'ड्यूटीवर',
    offDuty: 'ऑफ ड्यूटी',
    driving: 'चालवत आहे',
    assignedVehicles: 'नेमून दिलेली वाहने',
    activeVehicle: 'सध्याचे वाहन',
    selectVehicle: 'वाहन निवडा',
    switchVehicle: 'वाहन बदला',
    quickActions: 'जलद कार्ये',
    refuelAction: 'इंधन भरा (डिझेल / सीएनजी)',
    serviceAction: 'सर्व्हिस / देखभाल',
    repairAction: 'दुरुस्ती / ब्रेकडाउन',
    tripWorkAction: 'ट्रिप कार्य (सुरू / पूर्ण)',
    reportProblem: 'वाहन समस्या नोंदवा',

    tabHome: 'मुख्यपृष्ठ',
    tabVehicles: 'माझी वाहने',
    tabWork: 'आजचे काम',
    tabTrips: 'माझ्या ट्रिप्स',
    tabFuel: 'इंधन व खर्च',
    tabService: 'सर्व्हिस व दुरुस्ती',
    tabDocs: 'कागदपत्रे',
    tabPayments: 'माझे पेमेंट्स',
    tabHelp: 'मदत व सपोर्ट',

    diesel: 'डिझेल',
    cng: 'सीएनजी',
    litres: 'लिटर',
    kg: 'किलो',
    currentOdo: 'सध्याचे ओडोमीटर (कि.मी.) *',
    fuelQuantity: 'इंधनाचे प्रमाण',
    fuelRate: 'दर (₹ / लिटर किंवा किलो) *',
    totalAmount: 'एकूण रक्कम (₹)',
    fillType: 'टाकी भरण्याचा प्रकार',
    fullTank: 'फुल टाकी (Full Tank)',
    partialFill: 'काही प्रमाणात भरले',
    fuelStation: 'पेट्रोल पंप / गॅस स्टेशन',
    receiptPhoto: 'पावतीचा फोटो *',
    addPhoto: 'फोटो जोडा',
    submitRefuel: 'इंधन नोंद सबमिट करा',

    serviceType: 'सर्व्हिसचा प्रकार *',
    workshopGarage: 'वर्कशॉप / गॅरेज *',
    workDetails: 'कामाचा तपशील',
    invoicePhoto: 'बिल / पावतीचा फोटो *',
    submitService: 'सर्व्हिस नोंद सबमिट करा',

    startTrip: 'ट्रिप सुरू करा',
    endTrip: 'ट्रिप पूर्ण करा',
    startOdo: 'सुरुवातीचे ओडो (कि.मी.) *',
    endOdo: 'शेवटचे ओडो (कि.मी.) *',
    fromLoading: 'कुठून (लोडिंग)',
    toUnloading: 'कुठे (अनलोडिंग)',
    loadType: 'मालाचा प्रकार',
    fruitGoods: 'फळे / मालवाहतूक',

    onlineSynced: 'ऑनलाइन – सर्व नोंदी सिंक झाल्या आहेत.',
    offlineSaving: 'ऑफलाइन मोड – आपले काम या फोनवर सुरक्षित सेव्ह होत आहे.',
    waitingToSync: 'नोंदी सिंक होण्यासाठी प्रतीक्षेत',
    syncingNow: 'नोंदी सिंक होत आहेत...',
    allSynced: 'सर्व नोंदी यशस्वीरीत्या सिंक झाल्या.',
    syncFailed: 'काही नोंदी सिंक होऊ शकल्या नाहीत. पुन्हा प्रयत्न करा.',
    syncNow: 'आता सिंक करा',
    queue: 'ऑफलाइन रांग',

    vehicleType: 'वाहनाचा प्रकार',
    lastVerifiedOdo: 'शेवटचे तपासलेले ओडो',
    insuranceValidTill: 'विमा वैधता',
    pucValidTill: 'पीयूसी वैधता',
    viewOnly: 'फक्त पाहण्यासाठी',
    fuelAverage: 'इंधन सरासरी',
    totalFuel: 'एकूण इंधन',
    totalDistance: 'एकूण अंतर',
    fuelCost: 'इंधन खर्च',
  },
  hi: {
    appName: 'फ्लीटपल्स टीएमएस',
    driverPortal: 'ड्राइवर ऐप',
    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दोपहर',
    goodEvening: 'शुभ संध्या',
    onDuty: 'ड्यूटी पर',
    offDuty: 'ड्यूटी समाप्त',
    driving: 'गाड़ी चला रहे हैं',
    assignedVehicles: 'सौंपे गए वाहन',
    activeVehicle: 'वर्तमान वाहन',
    selectVehicle: 'वाहन चुनें',
    switchVehicle: 'वाहन बदलें',
    quickActions: 'त्वरित कार्य',
    refuelAction: 'ईंधन भरें (डीजल / सीएनजी)',
    serviceAction: 'सर्विस / रखरखाव',
    repairAction: 'मरम्मत / ब्रेकडाउन',
    tripWorkAction: 'ट्रिप कार्य (शुरू / समाप्त)',
    reportProblem: 'वाहन खराबी रिपोर्ट करें',

    tabHome: 'होम',
    tabVehicles: 'मेरे वाहन',
    tabWork: 'आज का कार्य',
    tabTrips: 'मेरी ट्रिप्स',
    tabFuel: 'ईंधन और खर्च',
    tabService: 'सर्विस व मरम्मत',
    tabDocs: 'दस्तावेज़',
    tabPayments: 'मेरे भुगतान',
    tabHelp: 'सहायता व सहायता',

    diesel: 'डीजल',
    cng: 'सीएनजी',
    litres: 'लीटर',
    kg: 'किलो',
    currentOdo: 'वर्तमान ओडोमीटर (कि.मी.) *',
    fuelQuantity: 'ईंधन मात्रा',
    fuelRate: 'दर (₹ / प्रति यूनिट) *',
    totalAmount: 'कुल राशि (₹)',
    fillType: 'टैंक भरने का प्रकार',
    fullTank: 'फुल टैंक (Full Tank)',
    partialFill: 'आंशिक भरा',
    fuelStation: 'पेट्रोल पंप / स्टेशन',
    receiptPhoto: 'रसीद फोटो *',
    addPhoto: 'फोटो जोड़ें',
    submitRefuel: 'ईंधन प्रविष्टि दर्ज करें',

    serviceType: 'सर्विस का प्रकार *',
    workshopGarage: 'वर्कशॉप / गैरेज *',
    workDetails: 'कार्य विवरण',
    invoicePhoto: 'बिल / रसीद फोटो *',
    submitService: 'सर्विस दर्ज करें',

    startTrip: 'ट्रिप शुरू करें',
    endTrip: 'ट्रिप समाप्त करें',
    startOdo: 'शुरुआती ओडो (कि.मी.) *',
    endOdo: 'अंतिम ओडो (कि.मी.) *',
    fromLoading: 'कहाँ से (लोडिंग)',
    toUnloading: 'कहाँ तक (अनलोडिंग)',
    loadType: 'माल का प्रकार',
    fruitGoods: 'फल / वाणिज्यिक माल',

    onlineSynced: 'ऑनलाइन – सभी रिकॉर्ड सिंक हो गए हैं।',
    offlineSaving: 'ऑफलाइन मोड – आपका कार्य इस फोन पर सुरक्षित सेव हो रहा है।',
    waitingToSync: 'रिकॉर्ड सिंक होने की प्रतीक्षा में',
    syncingNow: 'रिकॉर्ड सिंक हो रहे हैं...',
    allSynced: 'सभी रिकॉर्ड सफलतापूर्वक सिंक हुए।',
    syncFailed: 'कुछ रिकॉर्ड सिंक नहीं हो सके। पुनः प्रयास करें।',
    syncNow: 'अभी सिंक करें',
    queue: 'ऑफलाइन कतार',

    vehicleType: 'वाहन का प्रकार',
    lastVerifiedOdo: 'अंतिम सत्यापित ओडो',
    insuranceValidTill: 'बीमा वैधता',
    pucValidTill: 'पीयूसी वैधता',
    viewOnly: 'केवल देखने के लिए',
    fuelAverage: 'ईंधन औसत',
    totalFuel: 'कुल ईंधन',
    totalDistance: 'कुल दूरी',
    fuelCost: 'ईंधन लागत',
  },
};


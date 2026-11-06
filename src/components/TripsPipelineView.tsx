import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Package,
  IndianRupee,
  FileCheck2,
  Bell,
  ArrowRight,
  Repeat,
  Check,
  AlertCircle,
  Trash2,
  Edit3,
  Pencil,
  Save,
  ChevronUp,
  ChevronDown,
  Layers,
  Navigation,
  Upload,
} from 'lucide-react';
import { useTMS } from '../context/TMSContext';
import { Trip, TripDestination, DeliveryItem, ReturnLoadDeliveryLocation } from '../types/tms';
import { readFileAsDataURL } from '../utils/fileUploadHelper';
import { handleFormKeyDown } from '../utils/keyboardNavigation';
import { LottieAnimation } from './common/LottieAnimation';
import { EmptyState } from './common/EmptyState';

export const TripsPipelineView: React.FC = () => {
  const {
    trips,
    vehicles,
    drivers,
    parties,
    addTrip,
    updateTripDestinations,
    approveTrip,
    rejectTrip,
    resubmitTrip,
    addReturnLoad,
    editReturnLoad,
    toggleLRSubmitted,
    settleReturnLoadPayment,
    uploadStampedLRPhoto,
    role,
    userPermissions,
  } = useTMS();

  // Create Trip Modal State
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || '');
  const [outDate, setOutDate] = useState(new Date().toISOString().split('T')[0]);
  const [startingLocation, setStartingLocation] = useState('Pune APMC Market (Maharashtra)');
  const [tripCapacityError, setTripCapacityError] = useState<string | null>(null);
  const [adminOverrideCapacity, setAdminOverrideCapacity] = useState(false);

  // 3-4 Places (Destinations in Gujarat) with dynamic item lists for new trip
  const [destinations, setDestinations] = useState<TripDestination[]>([
    {
      id: 'dest-new-1',
      stopSequence: 1,
      placeName: 'Vapi APMC Fruit Yard',
      city: 'Vapi',
      state: 'Gujarat',
      contactPerson: 'Suresh Patel',
      mobile: '+91 98240 77192',
      paymentTerm: 'immediate',
      quickReminderDate: '',
      deliveryStatus: 'pending',
      items: [
        {
          id: 'item-new-1',
          itemName: 'Ratnagiri Alphonso Mangoes (24kg Box)',
          quantity: 30, // User example: 30
          costPerItem: 30, // User example: 30
          totalAmount: 900, // 30 x 30 = 900
        },
      ],
      destinationTotalAmount: 900,
    },
    {
      id: 'dest-new-2',
      stopSequence: 2,
      placeName: 'Surat Ring Road Fruit Mandi (Shop #42)',
      city: 'Surat',
      state: 'Gujarat',
      contactPerson: 'Kantilal Shah',
      mobile: '+91 98251 33410',
      paymentTerm: '1_month',
      quickReminderDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      deliveryStatus: 'pending',
      items: [
        {
          id: 'item-new-2',
          itemName: 'Solapur Kesar Pomegranates (15kg Box)',
          quantity: 40,
          costPerItem: 50,
          totalAmount: 2000,
        },
      ],
      destinationTotalAmount: 2000,
    },
    {
      id: 'dest-new-3',
      stopSequence: 3,
      placeName: 'Vadodara Sayajiganj Mandi',
      city: 'Vadodara',
      state: 'Gujarat',
      contactPerson: 'Bhavesh Dave',
      mobile: '+91 98242 11904',
      paymentTerm: '2_months',
      quickReminderDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      deliveryStatus: 'pending',
      items: [
        {
          id: 'item-new-3',
          itemName: 'Nashik Thompson Seedless Grapes (10kg Carton)',
          quantity: 50,
          costPerItem: 45,
          totalAmount: 2250,
        },
      ],
      destinationTotalAmount: 2250,
    },
  ]);

// Gujarat Western Corridor sequence for Outbound Fruit Deliveries (Maharashtra -> Gujarat)
const GUJARAT_CORRIDOR_SEQUENCE = [
  { city: 'Vapi', placeName: 'Vapi APMC Wholesale Fruit Yard', contactPerson: 'Suresh Patel', mobile: '+91 98240 77192' },
  { city: 'Navsari', placeName: 'Navsari APMC Fruit Market', contactPerson: 'Dipak Desai', mobile: '+91 94270 33100' },
  { city: 'Surat', placeName: 'Surat Ring Road Fruit Mandi (Shop #42)', contactPerson: 'Kantilal Shah', mobile: '+91 98251 33410' },
  { city: 'Ankleshwar', placeName: 'Ankleshwar GIDC Fruit Terminal', contactPerson: 'Mahesh Solanki', mobile: '+91 98250 88912' },
  { city: 'Bharuch', placeName: 'Bharuch Station Road Agro Inward Yard', contactPerson: 'Iqbal Memon', mobile: '+91 94260 88120' },
  { city: 'Vadodara', placeName: 'Vadodara Sayajiganj Mandi Terminal', contactPerson: 'Bhavesh Dave', mobile: '+91 98242 11904' },
  { city: 'Anand', placeName: 'Anand APMC Fruit Distribution Depot', contactPerson: 'Kishore Parmar', mobile: '+91 98981 44521' },
  { city: 'Nadiad', placeName: 'Nadiad Santram Mandi Yard', contactPerson: 'Pravin Vaghela', mobile: '+91 98795 22109' },
  { city: 'Ahmedabad', placeName: 'Ahmedabad Naroda APMC Terminal', contactPerson: 'Jignesh Patel', mobile: '+91 98790 12091' },
  { city: 'Gandhinagar', placeName: 'Gandhinagar Sector 21 Fruit Depot', contactPerson: 'Chetan Shah', mobile: '+91 98240 66320' },
  { city: 'Rajkot', placeName: 'Rajkot Bedi Para APMC Market', contactPerson: 'Nitin Jadeja', mobile: '+91 98252 77410' },
];

function getNextCorridorStop(currentLastCity?: string) {
  if (!currentLastCity) return GUJARAT_CORRIDOR_SEQUENCE[0];
  const normalized = currentLastCity.toLowerCase().trim();
  const currentIndex = GUJARAT_CORRIDOR_SEQUENCE.findIndex(
    (s) => normalized.includes(s.city.toLowerCase()) || s.city.toLowerCase().includes(normalized)
  );
  if (currentIndex >= 0 && currentIndex < GUJARAT_CORRIDOR_SEQUENCE.length - 1) {
    return GUJARAT_CORRIDOR_SEQUENCE[currentIndex + 1];
  }
  return GUJARAT_CORRIDOR_SEQUENCE[8]; // Default to Ahmedabad
}

// Maharashtra destination drops for Return Loads (Backhaul from Gujarat)
const MAHARASHTRA_RETURN_DROPS: Array<{ city: string; placeName: string; consigneeName: string; mobile: string }> = [
  { city: 'Bhiwandi', placeName: 'Bhiwandi Central Textile Godown #12', consigneeName: 'Prakash Textile Agency', mobile: '+91 98201 11223' },
  { city: 'Thane', placeName: 'Thane Majiwada Industrial Warehouse', consigneeName: 'ChemTech Logistics', mobile: '+91 98211 44556' },
  { city: 'Mumbai', placeName: 'Mumbai Wadala Truck Terminal / APMC Vashi', consigneeName: 'Evergreen Cargo Consignee', mobile: '+91 98200 88991' },
  { city: 'Pune', placeName: 'Pune Market Yard Wholesale Depot #4', consigneeName: 'Vikas Trading Co.', mobile: '+91 98224 55667' },
  { city: 'Nashik', placeName: 'Nashik Ambad MIDC Complex', consigneeName: 'Maharashtra Tiles & Freight Hub', mobile: '+91 94222 33445' },
  { city: 'Solapur', placeName: 'Solapur MIDC Wholesale Yard', consigneeName: 'Solapur Traders Syndicate', mobile: '+91 94220 77123' },
  { city: 'Kolhapur', placeName: 'Kolhapur Shiroli Industrial Terminal', consigneeName: 'Kolhapur Freight Line', mobile: '+91 98231 66543' },
];

  // Edit Outbound Fruit Delivery Places Modal State (User Requirement)
  const [editingTripForDestinations, setEditingTripForDestinations] = useState<Trip | null>(null);
  const [editDestinations, setEditDestinations] = useState<TripDestination[]>([]);

  // Return Load Modal State (with multi-delivery locations: "How many locations to delivered on which location")
  const [selectedTripForReturn, setSelectedTripForReturn] = useState<Trip | null>(null);
  const [returnParty, setReturnParty] = useState('Surat Royal Textile Mills Ltd');
  const [returnLoadingCity, setReturnLoadingCity] = useState('Surat');
  const [returnGoods, setReturnGoods] = useState('Cotton Textile Bales & Yarn Spools');
  const [loadRentCharge, setLoadRentCharge] = useState<number>(10500); // User example: 10500
  const [returnLRNumber, setReturnLRNumber] = useState('LR-GJ-9812');
  const [returnReminderDate, setReturnReminderDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );

  const [returnTotalWeight, setReturnTotalWeight] = useState<number>(12000);
  const [returnTotalQty, setReturnTotalQty] = useState<number>(85);

  // Return Load Multi-Drop Delivery Locations State (Master Prompt Section 10 & 11)
  const [returnDeliveryLocations, setReturnDeliveryLocations] = useState<ReturnLoadDeliveryLocation[]>([
    {
      id: 'rloc-1',
      dropOrder: 1,
      placeName: '',
      city: '',
      consigneeName: '',
      mobile: '',
      deliveryStatus: 'pending',
    },
  ]);

  const handleAddReturnLocation = () => {
    const nextIdx = returnDeliveryLocations.length;
    const newLoc: ReturnLoadDeliveryLocation = {
      id: `rloc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dropOrder: nextIdx + 1,
      placeName: '',
      city: '',
      consigneeName: '',
      mobile: '',
      deliveryStatus: 'pending',
    };
    setReturnDeliveryLocations([...returnDeliveryLocations, newLoc]);
  };

  const handleRemoveReturnLocation = (idx: number) => {
    if (returnDeliveryLocations.length <= 1) {
      alert('At least one delivery location is required.');
      return;
    }
    const updated = returnDeliveryLocations.filter((_, i) => i !== idx);
    const reindexed = updated.map((l, i) => ({ ...l, dropOrder: i + 1 }));
    setReturnDeliveryLocations(reindexed);
  };

  const handleMoveReturnLocation = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= returnDeliveryLocations.length) return;
    const updated = [...returnDeliveryLocations];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    const reindexed = updated.map((l, i) => ({ ...l, dropOrder: i + 1 }));
    setReturnDeliveryLocations(reindexed);
  };

  const handleReturnLocationChange = (
    idx: number,
    field: keyof ReturnLoadDeliveryLocation,
    value: any
  ) => {
    const updated = [...returnDeliveryLocations];
    updated[idx] = { ...updated[idx], [field]: value };
    setReturnDeliveryLocations(updated);
  };

  // Settlement Modal State
  const [settlingTrip, setSettlingTrip] = useState<Trip | null>(null);
  const [settledAmountInput, setSettledAmountInput] = useState<number>(10500);

  // Dynamic Item calculations for NEW TRIP: Quantity * Cost = Result (Prompt: "Quantity=30,Cost per item=30 result=900")
  const handleItemChange = (
    destIdx: number,
    itemIdx: number,
    field: keyof DeliveryItem,
    value: string | number
  ) => {
    const updated = [...destinations];
    const item = { ...updated[destIdx].items[itemIdx], [field]: value };

    if (field === 'quantity' || field === 'costPerItem') {
      const q = Number(item.quantity) || 0;
      const c = Number(item.costPerItem) || 0;
      item.totalAmount = q * c; // Auto Calculate!
    }

    updated[destIdx].items[itemIdx] = item;
    updated[destIdx].destinationTotalAmount = updated[destIdx].items.reduce(
      (sum, i) => sum + i.totalAmount,
      0
    );
    setDestinations(updated);
  };

  const handleAddItem = (destIdx: number) => {
    const updated = [...destinations];
    updated[destIdx].items.push({
      id: `item-${Date.now()}`,
      itemName: 'Nagpur Oranges (20kg Box)',
      quantity: 30,
      costPerItem: 30,
      totalAmount: 900,
    });
    updated[destIdx].destinationTotalAmount = updated[destIdx].items.reduce(
      (sum, i) => sum + i.totalAmount,
      0
    );
    setDestinations(updated);
  };

  const handleRemoveItem = (destIdx: number, itemIdx: number) => {
    const updated = [...destinations];
    if (updated[destIdx].items.length <= 1) return;
    updated[destIdx].items.splice(itemIdx, 1);
    updated[destIdx].destinationTotalAmount = updated[destIdx].items.reduce(
      (sum, i) => sum + i.totalAmount,
      0
    );
    setDestinations(updated);
  };

  // Add delivery location NEXT TO THE LAST DELIVERY LOCATION (or next to specified stop)
  const handleAddDestination = (insertAfterIndex?: number) => {
    if (destinations.length >= 6) {
      alert('Maximum 6 places allowed per daily fruit delivery run.');
      return;
    }

    const targetIdx = insertAfterIndex !== undefined ? insertAfterIndex : destinations.length - 1;
    const targetStop = destinations[targetIdx];
    const nextStopInfo = getNextCorridorStop(targetStop?.city);

    const newDest: TripDestination = {
      id: `dest-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stopSequence: targetIdx + 2,
      placeName: nextStopInfo.placeName,
      city: nextStopInfo.city,
      state: 'Gujarat',
      contactPerson: nextStopInfo.contactPerson,
      mobile: nextStopInfo.mobile,
      paymentTerm: 'immediate',
      quickReminderDate: '',
      deliveryStatus: 'pending',
      items: [
        {
          id: `item-${Date.now()}`,
          itemName: 'Assorted Fresh Fruit Crates (Grade-A)',
          quantity: 30,
          costPerItem: 35,
          totalAmount: 1050,
        },
      ],
      destinationTotalAmount: 1050,
    };

    const updated = [...destinations];
    updated.splice(targetIdx + 1, 0, newDest);
    const resequenced = updated.map((d, idx) => ({ ...d, stopSequence: idx + 1 }));
    setDestinations(resequenced);
  };

  const handleMoveDestination = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= destinations.length) return;
    const updated = [...destinations];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    const resequenced = updated.map((d, i) => ({ ...d, stopSequence: i + 1 }));
    setDestinations(resequenced);
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === selectedVehicleId);
    const drv = drivers.find((d) => d.id === selectedDriverId);

    const result = addTrip({
      vehicleId: selectedVehicleId,
      vehicleNumber: veh?.number || 'MH-12-RN-4892',
      vehicleStateCode: veh?.stateCode || 'MH',
      driverId: selectedDriverId,
      driverName: drv?.fullName || 'Assigned Driver',
      outDate,
      startingLocation,
      destinations,
      overrideCapacityWarning: adminOverrideCapacity,
    });

    if (!result.success) {
      setTripCapacityError(result.message);
      return;
    }

    setTripCapacityError(null);
    setAdminOverrideCapacity(false);
    setIsAddTripModalOpen(false);
  };

  // --- Handlers for Editing Existing Trip Destinations After Creation ---
  const handleOpenEditDestinations = (trip: Trip) => {
    setEditingTripForDestinations(trip);
    // Deep clone the destinations list
    setEditDestinations(JSON.parse(JSON.stringify(trip.destinations)));
  };

  const handleEditDestFieldChange = (
    destIdx: number,
    field: keyof TripDestination,
    value: any
  ) => {
    const updated = [...editDestinations];
    updated[destIdx] = { ...updated[destIdx], [field]: value };
    setEditDestinations(updated);
  };

  const handleEditItemChange = (
    destIdx: number,
    itemIdx: number,
    field: keyof DeliveryItem,
    value: string | number
  ) => {
    const updated = [...editDestinations];
    const item = { ...updated[destIdx].items[itemIdx], [field]: value };

    if (field === 'quantity' || field === 'costPerItem') {
      const q = Number(item.quantity) || 0;
      const c = Number(item.costPerItem) || 0;
      item.totalAmount = q * c; // Live auto-recalculate: Quantity * Cost = Subtotal
    }

    updated[destIdx].items[itemIdx] = item;
    updated[destIdx].destinationTotalAmount = updated[destIdx].items.reduce(
      (sum, i) => sum + i.totalAmount,
      0
    );
    setEditDestinations(updated);
  };

  const handleEditAddItem = (destIdx: number) => {
    const updated = [...editDestinations];
    updated[destIdx].items.push({
      id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemName: 'Alphonso Mango Box (Grade-A)',
      quantity: 30,
      costPerItem: 30,
      totalAmount: 900,
    });
    updated[destIdx].destinationTotalAmount = updated[destIdx].items.reduce(
      (sum, i) => sum + i.totalAmount,
      0
    );
    setEditDestinations(updated);
  };

  const handleEditRemoveItem = (destIdx: number, itemIdx: number) => {
    const updated = [...editDestinations];
    if (updated[destIdx].items.length <= 1) {
      alert('Each destination place must have at least one fruit item.');
      return;
    }
    updated[destIdx].items.splice(itemIdx, 1);
    updated[destIdx].destinationTotalAmount = updated[destIdx].items.reduce(
      (sum, i) => sum + i.totalAmount,
      0
    );
    setEditDestinations(updated);
  };

  // Add delivery location NEXT TO THE LAST DELIVERY LOCATION (or next to specified stop) in Edit modal
  const handleEditAddDestinationPlace = (insertAfterIndex?: number) => {
    if (editDestinations.length >= 6) {
      alert('Maximum 6 places allowed per daily fruit delivery run on the Maharashtra ⇄ Gujarat route.');
      return;
    }

    const targetIdx = insertAfterIndex !== undefined ? insertAfterIndex : editDestinations.length - 1;
    const targetStop = editDestinations[targetIdx];
    const nextStopInfo = getNextCorridorStop(targetStop?.city);

    const newDest: TripDestination = {
      id: `dest-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stopSequence: targetIdx + 2,
      placeName: nextStopInfo.placeName,
      city: nextStopInfo.city,
      state: 'Gujarat',
      contactPerson: nextStopInfo.contactPerson,
      mobile: nextStopInfo.mobile,
      paymentTerm: 'immediate',
      quickReminderDate: '',
      deliveryStatus: 'pending',
      items: [
        {
          id: `item-${Date.now()}`,
          itemName: 'Assorted Fresh Fruit Crates (Grade-A)',
          quantity: 30,
          costPerItem: 30,
          totalAmount: 900,
        },
      ],
      destinationTotalAmount: 900,
    };

    const updated = [...editDestinations];
    updated.splice(targetIdx + 1, 0, newDest);
    const resequenced = updated.map((d, idx) => ({ ...d, stopSequence: idx + 1 }));
    setEditDestinations(resequenced);
  };

  const handleEditMoveDestination = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= editDestinations.length) return;
    const updated = [...editDestinations];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    const resequenced = updated.map((d, i) => ({ ...d, stopSequence: i + 1 }));
    setEditDestinations(resequenced);
  };

  const handleEditRemoveDestinationPlace = (destIdx: number) => {
    if (editDestinations.length <= 1) {
      alert('At least one delivery place is required in Gujarat.');
      return;
    }
    if (!confirm('Are you sure you want to remove this delivery place from this trip?')) {
      return;
    }
    const updated = editDestinations.filter((_, idx) => idx !== destIdx);
    // Resequence stop numbers
    const resequenced = updated.map((d, idx) => ({ ...d, stopSequence: idx + 1 }));
    setEditDestinations(resequenced);
  };

  const handleSaveEditedDestinations = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTripForDestinations) return;

    updateTripDestinations(editingTripForDestinations.id, editDestinations);
    setEditingTripForDestinations(null);
  };

  // --- Return Load Handlers (Multi-location Delivery & Edit) ---
  const handleOpenReturnModal = (trip: Trip) => {
    setSelectedTripForReturn(trip);
    if (trip.returnLoad) {
      setLoadRentCharge(trip.returnLoad.loadRentCharge || 10500);
      setReturnLRNumber(trip.returnLoad.lrNumber || `LR-${trip.id.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`);
      setReturnParty(trip.returnLoad.loadingPartyName || 'Surat Royal Textile Mills Ltd');
      setReturnLoadingCity(trip.returnLoad.loadingCity || 'Surat');
      setReturnGoods(trip.returnLoad.goodsDescription || 'Cotton Textile Bales & Industrial Goods');
      setReturnTotalWeight(trip.returnLoad.weightKg || 12000);
      setReturnTotalQty(trip.returnLoad.quantity || 85);
      setReturnReminderDate(
        trip.returnLoad.reminderDate ||
          new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
      );
      if (trip.returnLoad.deliveryLocations && trip.returnLoad.deliveryLocations.length > 0) {
        setReturnDeliveryLocations(JSON.parse(JSON.stringify(trip.returnLoad.deliveryLocations)));
      } else {
        setReturnDeliveryLocations([
          {
            id: 'rloc-1',
            dropOrder: 1,
            placeName: '',
            city: trip.returnLoad.deliveryCity || '',
            consigneeName: '',
            mobile: '',
            deliveryStatus: 'pending',
          },
        ]);
      }
    } else {
      setLoadRentCharge(10500);
      setReturnLRNumber(`LR-${trip.id.slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`);
      setReturnParty('Surat Royal Textile Mills Ltd');
      setReturnLoadingCity('Surat');
      setReturnGoods('Cotton Textile Bales & Yarn Spools');
      setReturnTotalWeight(12000);
      setReturnTotalQty(85);
      setReturnReminderDate(
        new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
      );
      setReturnDeliveryLocations([
        {
          id: 'rloc-1',
          dropOrder: 1,
          placeName: '',
          city: '',
          consigneeName: '',
          mobile: '',
          deliveryStatus: 'pending',
        },
      ]);
    }
  };

  const handleSaveReturnLoad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripForReturn) return;

    const consolidatedCities = returnDeliveryLocations.map((l) => l.city).filter(Boolean);
    const computedCity = consolidatedCities.length > 1
      ? `${consolidatedCities.join(' → ')} (${consolidatedCities.length} Locations)`
      : (consolidatedCities[0] || 'Maharashtra Destination');

    const payload = {
      loadingPartyName: returnParty,
      loadingCity: returnLoadingCity,
      deliveryCity: computedCity,
      deliveryLocationsCount: returnDeliveryLocations.length,
      deliveryLocations: returnDeliveryLocations,
      goodsDescription: returnGoods,
      quantity: returnTotalQty || 1,
      weightKg: returnTotalWeight || 1000,
      loadRentCharge,
      lrNumber: returnLRNumber,
      reminderDate: returnReminderDate,
    };

    if (selectedTripForReturn.returnLoad) {
      // Edit existing return load (Master Prompt Section 2.B)
      editReturnLoad(selectedTripForReturn.id, payload);
    } else {
      // Add new return load
      addReturnLoad(selectedTripForReturn.id, {
        ...payload,
        hasStampedLR: false,
        lrSubmittedToParty: false,
      });
    }

    setSelectedTripForReturn(null);
  };

  const handleOpenSettleModal = (trip: Trip) => {
    setSettlingTrip(trip);
    setSettledAmountInput(trip.returnLoad?.loadRentCharge || 10500);
  };

  const handleConfirmSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingTrip || !settlingTrip.returnLoad) return;
    settleReturnLoadPayment(settlingTrip.returnLoad.id, settledAmountInput);
    setSettlingTrip(null);
  };

  // Check if current user has permission to approve trips
  const canApprove = role === 'admin' || (role === 'operator' && userPermissions.canApproveTrips);

  // Total value of currently edited destinations
  const currentEditTotalFruitValue = editDestinations.reduce(
    (sum, d) => sum + d.destinationTotalAmount,
    0
  );

  return (
    <div className="space-y-4">
      {/* Top Banner & Action */}
      <div className="morning-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#E2EDF8]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-heading text-lg font-black text-[#1E293B]">
              Maharashtra to Gujarat Daily Routing & Dispatches
            </h2>
            <span className="bg-[#BDDDFC]/50 text-[#384959] border border-[#BDDDFC] text-xs font-bold px-2.5 py-0.5 rounded-full">
              Fruit Outbound + Gujarat Return Load
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Deliver fruits from Maharashtra to 3–4 Gujarat places (Immediate / 1–3 months payment), then load return goods with stamped LR and settlement tracking. Delivery places and fruit items can be edited anytime after creation.
          </p>
        </div>

        <button
          onClick={() => setIsAddTripModalOpen(true)}
          className="px-4 py-2.5 text-xs font-bold text-white bg-[#384959] hover:bg-[#2C3A47] rounded-xl shadow-xs flex items-center gap-2 transition-all self-start md:self-auto cursor-pointer font-heading shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Daily Trip (Fruit Delivery)</span>
        </button>
      </div>

      {/* Trips List */}
      <div className="space-y-4">
        {trips.length === 0 && (
          <EmptyState
            title="No Interstate Daily Trips Dispatched Yet"
            description="Create your first Maharashtra to Gujarat daily fruit delivery dispatch to begin tracking multi-stop deliveries, payments, and backhaul return loads."
            actionLabel="New Daily Trip (Fruit Delivery)"
            onAction={() => setIsAddTripModalOpen(true)}
          />
        )}

        {trips.map((trip) => {
          const isPending = trip.status === 'pending_approval';
          const isDelivered = trip.status === 'delivered';

          return (
            <div
              key={trip.id}
              className={`bg-white border rounded-2xl shadow-xs overflow-hidden transition-all morning-card ${
                isPending
                  ? 'border-amber-400 ring-2 ring-amber-100'
                  : 'border-[#DCE8F2] hover:border-[#88BDF2]'
              }`}
            >
              {/* Trip Header Bar */}
              <div className="p-4 bg-white border-b border-[#DCE8F2] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6A89A7] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {trip.vehicleStateCode}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-extrabold text-[#384959] text-sm bg-[#F0F4F8] px-2 py-0.5 rounded border border-[#DCE8F2]">
                        {trip.id}
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                        {trip.vehicleNumber}
                      </span>
                      <span className="text-xs text-slate-600">
                        (Driver: <strong className="text-slate-900 font-bold">{trip.driverName}</strong>)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>Out Date: <strong className="font-mono text-slate-800">{trip.outDate}</strong></span>
                      <span>•</span>
                      <span>Origin: {trip.startingLocation}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Badge */}
                  {isPending && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Pending Approval by Admin/User</span>
                    </span>
                  )}
                  {trip.status === 'approved' && (
                    <span className="bg-[#BDDDFC]/50 text-[#384959] border border-[#BDDDFC] font-bold text-xs px-2.5 py-1 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#384959]" />
                      <span>Approved (Active Trip)</span>
                    </span>
                  )}
                  {trip.status === 'in_transit' && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-heading">
                      <LottieAnimation
                        animationPath="/assets/animations/truck-in-transit.json"
                        className="w-6 h-4"
                        fallbackIcon={<Truck className="w-3.5 h-3.5" />}
                        ariaLabel="In Transit"
                      />
                      <span>In Transit (MH → GJ)</span>
                    </span>
                  )}
                  {isDelivered && (
                    <span className="bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-heading">
                      <LottieAnimation
                        animationPath="/assets/animations/success-check.json"
                        className="w-4 h-4"
                        fallbackIcon={<Check className="w-3.5 h-3.5 text-slate-700" />}
                        ariaLabel="Completed"
                      />
                      <span>Completed</span>
                    </span>
                  )}

                  {/* Approve / Reject Controls for Admin / User */}
                  {isPending && canApprove && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => approveTrip(trip.id)}
                        className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-md shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter correction reason for driver:');
                          if (reason) rejectTrip(trip.id, reason);
                        }}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {/* Rejection Notification Banner & Resubmission */}
                  {trip.status === 'rejected' && (
                    <div className="mt-2 p-3 bg-rose-50 border border-rose-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-heading font-black text-rose-900 block">
                          ⚠️ Manifest Rejected by Operations
                        </span>
                        <span className="text-rose-700 text-[11px] font-medium">
                          Reason: {trip.approvalInfo?.rejectionReason || 'Information correction required.'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          resubmitTrip(trip.id);
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                        <span>Resubmit for Approval</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Trip Body: Fruit Deliveries (3 to 4 Places) */}
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#DCE8F2] gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#384959] uppercase tracking-wider flex items-center gap-1.5 font-heading">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>Outbound Fruit Delivery Places in Gujarat ({trip.destinations.length} Stops)</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#384959] bg-[#BDDDFC]/30 px-2.5 py-1 rounded-lg border border-[#BDDDFC]">
                        Total Fruit Value: ₹{trip.totalFruitValue.toLocaleString('en-IN')}
                      </span>

                      {/* EDIT OPTION FOR OUTBOUND FRUIT DELIVERY PLACES (User Requirement) */}
                      <button
                        onClick={() => handleOpenEditDestinations(trip)}
                        className="px-3 py-1.5 text-xs font-bold text-[#384959] bg-[#BDDDFC]/40 hover:bg-[#BDDDFC]/80 border border-[#BDDDFC] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-heading shadow-xs"
                        title="Edit delivery places, fruit items, quantities, costs, and payment terms"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#384959]" />
                        <span>Edit Delivery Places</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                    {trip.destinations.map((dest, destIdx) => (
                      <div
                        key={dest.id}
                        className="p-3.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs space-y-2 hover:border-[#88BDF2] transition-colors relative group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <span className="font-heading font-bold text-[#384959] block">
                              {destIdx + 1}. {dest.placeName}
                            </span>
                            <span className="text-[#6A89A7] font-medium">{dest.city}, {dest.state}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase ${
                                dest.paymentTerm === 'immediate'
                                  ? 'bg-[#BDDDFC]/50 text-[#384959] border-[#BDDDFC]'
                                  : 'bg-[#F0F4F8] text-[#384959] border-[#DCE8F2]'
                              }`}
                            >
                              {dest.paymentTerm === 'immediate' ? 'Immediate Pay' : `${dest.paymentTerm.replace('_', ' ')} Due`}
                            </span>
                            {/* Quick edit button on destination card */}
                            <button
                              onClick={() => handleOpenEditDestinations(trip)}
                              className="p-1 hover:bg-[#BDDDFC]/40 text-[#6A89A7] hover:text-[#384959] rounded-lg transition-colors cursor-pointer"
                              title="Edit this place"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Items Manifest */}
                        <div className="bg-white p-2.5 rounded-xl border border-[#DCE8F2] space-y-1">
                          <span className="text-[10px] font-bold text-[#6A89A7] uppercase block font-heading">Items List:</span>
                          {dest.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-[11px] font-mono text-slate-700 py-0.5 border-b border-slate-50 last:border-b-0"
                            >
                              <span className="font-sans font-medium text-[#384959] truncate max-w-[130px]">
                                {item.itemName}
                              </span>
                              <span>
                                {item.quantity} × ₹{item.costPerItem} = <strong className="text-[#384959]">₹{item.totalAmount}</strong>
                              </span>
                            </div>
                          ))}
                          <div className="pt-1.5 border-t border-[#DCE8F2] flex items-center justify-between text-xs font-bold text-[#384959]">
                            <span className="font-heading">Place Total:</span>
                            <span className="font-mono text-[#384959] font-extrabold">
                              ₹{dest.destinationTotalAmount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Reminder Note */}
                        {dest.quickReminderDate && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Payment Reminder: {dest.quickReminderDate}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Return Load Section (PRD: Take goods from party in Gujarat after fruit delivery) */}
                <div className="pt-2 border-t border-[#DCE8F2]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#384959] uppercase tracking-wider flex items-center gap-1.5 font-heading">
                      <Repeat className="w-3.5 h-3.5 text-[#6A89A7]" />
                      <span>Gujarat Return Load (Backhaul to Maharashtra)</span>
                    </span>

                    {!trip.returnLoad && (
                      <button
                        onClick={() => handleOpenReturnModal(trip)}
                        className="px-3 py-1.5 text-xs font-bold text-[#384959] bg-[#BDDDFC]/40 hover:bg-[#BDDDFC]/80 border border-[#BDDDFC] rounded-xl flex items-center gap-1 transition-colors cursor-pointer font-heading"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Return Load from Gujarat</span>
                      </button>
                    )}
                  </div>

                  {trip.returnLoad ? (
                    <div className="p-3.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl text-xs space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-[#DCE8F2]">
                        <div>
                          <span className="font-heading font-bold text-[#384959] text-sm">
                            {trip.returnLoad.loadingPartyName}
                          </span>
                          <span className="text-[#6A89A7] ml-2 font-mono text-xs">
                            ({trip.returnLoad.loadingCity} [GJ] → {trip.returnLoad.deliveryCity})
                          </span>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            Goods: <strong className="text-[#384959]">{trip.returnLoad.goodsDescription}</strong> ({trip.returnLoad.weightKg.toLocaleString()} KG)
                          </div>
                        </div>

                        {/* Rent of Load, Edit & Settlement Tag */}
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-[10px] text-[#6A89A7] font-bold uppercase block font-heading">
                              Rent Charged for Load
                            </span>
                            <span className="font-mono font-extrabold text-[#384959] text-sm">
                              ₹{trip.returnLoad.loadRentCharge.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {/* Edit Return Load Button (Master Prompt Section 2.B) */}
                          <button
                            onClick={() => handleOpenReturnModal(trip)}
                            className="px-3 py-1.5 bg-white border border-[#DCE8F2] hover:bg-[#F0F4F8] text-[#384959] font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 font-heading"
                            title="Edit consignor, delivered locations, LR & payment terms"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[#6A89A7]" />
                            <span>Edit</span>
                          </button>

                          {trip.returnLoad.isSettled ? (
                            <div className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl text-right shadow-2xs">
                              <span className="font-heading font-black text-xs block text-emerald-800 uppercase tracking-wide">
                                (Settled)
                              </span>
                              <span className="text-[10px] font-mono text-emerald-700">
                                Settled in: ₹{trip.returnLoad.settledAmount?.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenSettleModal(trip)}
                              className="px-3.5 py-1.5 bg-[#6A89A7] hover:bg-[#597793] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer font-heading"
                            >
                              Settle Payment
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Multi-Drop Delivery Locations Breakdown (Master Prompt Section 9 - Clean & Compact Display) */}
                      {trip.returnLoad.deliveryLocations && trip.returnLoad.deliveryLocations.length > 0 && (
                        <div className="p-3 bg-white rounded-xl border border-[#DCE8F2] shadow-2xs space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="text-[10px] font-extrabold text-[#384959] uppercase font-heading flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#6A89A7]" />
                              <span>Delivered on {trip.returnLoad.deliveryLocations.length} Locations:</span>
                            </span>
                            <span className="text-[10px] font-mono text-[#384959] font-semibold bg-[#F0F4F8] px-2 py-0.5 rounded-lg border border-[#DCE8F2]">
                              Total Weight: {trip.returnLoad.weightKg.toLocaleString()} KG
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {trip.returnLoad.deliveryLocations.map((loc, locIdx) => (
                              <span
                                key={loc.id || locIdx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#DCE8F2] text-xs font-medium text-[#384959] shadow-2xs"
                              >
                                <span className="w-4 h-4 rounded-full bg-[#6A89A7] text-white font-mono text-[9px] flex items-center justify-center font-bold">
                                  {loc.dropOrder || locIdx + 1}
                                </span>
                                <span className="font-heading font-bold text-[#384959]">{loc.city}</span>
                                {loc.placeName && (
                                  <span className="text-[#6A89A7] font-normal">({loc.placeName})</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* LR & Stamped Status Controls */}
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-[#384959]">
                            LR #: {trip.returnLoad.lrNumber}
                          </span>
                          <span className="text-[#DCE8F2]">•</span>

                          {/* Driver Got Stamped LR? (Master Prompt Section 8: Allow stamped LR photo/document uploads) */}
                          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                            {trip.returnLoad.hasStampedLR ? (
                              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Stamped LR Received</span>
                                {trip.returnLoad.stampedLrPhotoUrl && (
                                  <button
                                    onClick={() => {
                                      const w = window.open('');
                                      if (w && trip.returnLoad?.stampedLrPhotoUrl) {
                                        w.document.write(`<img src="${trip.returnLoad.stampedLrPhotoUrl}" style="max-width:100%" alt="Stamped LR" />`);
                                      }
                                    }}
                                    className="text-[10px] underline text-[#6A89A7] hover:text-[#384959] cursor-pointer ml-1"
                                  >
                                    View Scan
                                  </button>
                                )}
                              </div>
                            ) : (
                              <label className="px-2.5 py-1 bg-white hover:bg-[#F0F4F8] border border-[#DCE8F2] text-[#384959] rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs">
                                <Upload className="w-3 h-3 text-[#6A89A7]" />
                                <span>Upload Stamped LR</span>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const res = await readFileAsDataURL(file);
                                        uploadStampedLRPhoto(trip.id, res.dataUrl, file.name);
                                      } catch (err: any) {
                                        alert(err.message);
                                      }
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>

                          <span className="text-[#DCE8F2]">•</span>

                          {/* Option: LR Submitted or Not to Party */}
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-[#384959]">LR Submitted to Party:</span>
                            <button
                              onClick={() => toggleLRSubmitted(trip.returnLoad!.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                trip.returnLoad.lrSubmittedToParty
                                  ? 'bg-[#384959] text-white border-[#384959] shadow-2xs'
                                  : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                              }`}
                            >
                              {trip.returnLoad.lrSubmittedToParty ? '✓ Yes, Submitted' : '✕ Not Submitted Yet'}
                            </button>
                          </div>
                        </div>

                        {trip.returnLoad.reminderDate && (
                          <div className="text-[11px] text-[#384959] font-mono bg-white px-2 py-0.5 rounded-lg border border-[#DCE8F2]">
                            Payment Reminder: <strong>{trip.returnLoad.reminderDate}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#F8FAFC] border border-dashed border-[#DCE8F2] rounded-xl text-center text-xs text-[#6A89A7]">
                      No return load assigned yet. Rig will return empty unless matched with Gujarat party goods.
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal 1: New Daily Fruit Delivery Trip */}
      {isAddTripModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#384959]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#DCE8F2] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-xs">
            {/* Header */}
            <div className="px-5 py-4 bg-[#384959] text-white flex items-center justify-between border-b border-[#2C3A47]">
              <div>
                <h3 className="font-heading font-bold text-sm tracking-tight text-white">
                  Create Daily Fruit Delivery Run (Maharashtra → Gujarat)
                </h3>
                <p className="text-[11px] text-[#BDDDFC] mt-0.5">
                  Select Vehicle, Driver, Out Date, and 3 to 4 Gujarat Destination Places with Auto-Calculating Items
                </p>
              </div>
              <button
                onClick={() => setIsAddTripModalOpen(false)}
                className="text-[#BDDDFC] hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTrip} onKeyDown={(e) => handleFormKeyDown(e)} className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Top Row: Vehicle, Driver, Out Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                    Vehicle Number
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-white border border-[#DCE8F2] rounded-xl px-3 py-2 font-mono font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/20"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.number} ({v.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                    Driver Name
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full bg-white border border-[#DCE8F2] rounded-xl px-3 py-2 text-[#384959] font-semibold focus:outline-none focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/20"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.mobile})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                    Date Out to Deliver Fruits
                  </label>
                  <input
                    type="date"
                    required
                    value={outDate}
                    onChange={(e) => setOutDate(e.target.value)}
                    className="w-full bg-white border border-[#DCE8F2] rounded-xl px-3 py-2 font-mono text-[#384959] font-bold focus:outline-none focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/20"
                  />
                </div>
              </div>

              {/* Capacity Display & Overload Validation (Master Prompt Section 4 & 6) */}
              {(() => {
                const veh = vehicles.find((v) => v.id === selectedVehicleId);
                const estWeight = destinations.reduce((sum, d) => {
                  return sum + d.items.reduce((itemSum, item) => {
                    const match = item.itemName.match(/(\d+)\s*kg/i);
                    const weight = match ? Number(match[1]) : 20;
                    return itemSum + (Number(item.quantity) || 1) * weight;
                  }, 0);
                }, 0);
                const maxCap = veh?.capacityKg || 16000;
                const remCap = maxCap - estWeight;
                const isOver = remCap < 0;

                return (
                  <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#DCE8F2] text-xs font-mono space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-slate-600">Max Capacity: <strong className="text-[#384959] font-bold">{maxCap.toLocaleString('en-IN')} KG</strong></span>
                      <span className="text-slate-600">Estimated Manifest Load: <strong className={isOver ? 'text-rose-600 font-bold' : 'text-[#384959] font-bold'}>{estWeight.toLocaleString('en-IN')} KG</strong></span>
                      <span className="text-slate-600">Remaining Capacity: <strong className={isOver ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>{remCap.toLocaleString('en-IN')} KG</strong></span>
                    </div>

                    {isOver && (
                      <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span>⚠️ Manifest load exceeds vehicle capacity by {Math.abs(remCap).toLocaleString('en-IN')} KG!</span>
                        {role === 'admin' ? (
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-rose-950 font-bold">
                            <input
                              type="checkbox"
                              checked={adminOverrideCapacity}
                              onChange={(e) => setAdminOverrideCapacity(e.target.checked)}
                            />
                            <span>Admin Authorize Overload Override</span>
                          </label>
                        ) : (
                          <span className="text-[11px] text-rose-700">Driver submission blocked until weight is reduced.</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {tripCapacityError && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold">
                  {tripCapacityError}
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                  Starting Origin Terminal in Maharashtra
                </label>
                <input
                  type="text"
                  value={startingLocation}
                  onChange={(e) => setStartingLocation(e.target.value)}
                  className="w-full bg-white border border-[#DCE8F2] rounded-xl px-3 py-2 font-medium text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/20"
                  placeholder="e.g. Pune APMC Market, Nashik Farm Depot, Solapur Yard"
                />
              </div>

              {/* Destinations Section (3 to 4 Places, Outbound Fruit Delivery Places in Gujarat) */}
              <div className="space-y-3">
                <div className="p-3.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-extrabold text-[#384959] text-xs">
                        Delivered Locations:
                      </span>
                      <span className="bg-white px-2.5 py-0.5 rounded-full border border-[#DCE8F2] font-mono font-bold text-[#384959] text-xs">
                        {destinations.length}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6A89A7] flex items-center gap-1 mt-1 flex-wrap">
                      <Navigation className="w-3 h-3 text-[#6A89A7]" />
                      <span className="font-semibold text-[#384959]">Route Flow:</span>
                      <span className="font-mono font-bold text-[#384959]">
                        {startingLocation.split(' ')[0]} → {destinations.map((d) => d.city || 'Place').join(' → ')}
                      </span>
                    </div>
                  </div>

                  {destinations.length < 8 && (
                    <button
                      type="button"
                      onClick={() => handleAddDestination()}
                      className="px-3.5 py-1.5 text-xs font-bold text-[#384959] bg-[#BDDDFC]/50 hover:bg-[#BDDDFC]/80 border border-[#BDDDFC] rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer font-heading self-start sm:self-auto transition-all"
                      title="Add one more delivered location"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Place</span>
                    </button>
                  )}
                </div>

                {destinations.map((dest, destIdx) => (
                  <div
                    key={dest.id}
                    className="p-4 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#6A89A7] text-white font-mono text-[10px] flex items-center justify-center font-bold">
                          {destIdx + 1}
                        </span>
                        <span className="font-heading font-extrabold text-[#384959] text-xs">
                          Location {destIdx + 1}: {dest.city || 'Gujarat City'}
                        </span>
                        {destIdx === destinations.length - 1 && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.2 rounded-full font-heading">
                            Last Delivery Location
                          </span>
                        )}

                        {/* Reordering Controls: Move Up / Move Down */}
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            onClick={() => handleMoveDestination(destIdx, 'up')}
                            disabled={destIdx === 0}
                            className="p-1 rounded bg-white border border-[#DCE8F2] hover:bg-[#F0F4F8] disabled:opacity-30 disabled:hover:bg-white text-[#384959] cursor-pointer disabled:cursor-not-allowed"
                            title="Move earlier in delivery route sequence"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDestination(destIdx, 'down')}
                            disabled={destIdx === destinations.length - 1}
                            className="p-1 rounded bg-white border border-[#DCE8F2] hover:bg-[#F0F4F8] disabled:opacity-30 disabled:hover:bg-white text-[#384959] cursor-pointer disabled:cursor-not-allowed"
                            title="Move later in delivery route sequence"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] uppercase font-bold text-[#384959]">
                            Payment Term:
                          </label>
                          <select
                            value={dest.paymentTerm}
                            onChange={(e) => {
                              const updated = [...destinations];
                              updated[destIdx].paymentTerm = e.target.value as any;
                              setDestinations(updated);
                            }}
                            className="bg-white border border-[#DCE8F2] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                          >
                            <option value="immediate">Immediate Payment</option>
                            <option value="1_month">1 Month (30 Days)</option>
                            <option value="2_months">2 Months (60 Days)</option>
                            <option value="3_months">3 Months (90 Days)</option>
                          </select>
                        </div>

                        {dest.paymentTerm !== 'immediate' && (
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] uppercase font-bold text-amber-800">
                              Quick Reminder:
                            </label>
                            <input
                              type="date"
                              value={dest.quickReminderDate || ''}
                              onChange={(e) => {
                                const updated = [...destinations];
                                updated[destIdx].quickReminderDate = e.target.value;
                                setDestinations(updated);
                              }}
                              className="bg-white border border-amber-300 rounded-lg px-2 py-0.5 text-xs font-mono"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#384959] uppercase mb-0.5 font-heading">
                          Market / Place Name
                        </label>
                        <input
                          type="text"
                          value={dest.placeName}
                          onChange={(e) => {
                            const updated = [...destinations];
                            updated[destIdx].placeName = e.target.value;
                            setDestinations(updated);
                          }}
                          className="w-full bg-white border border-[#DCE8F2] rounded-xl px-2.5 py-1.5 text-xs text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                          placeholder="e.g. Surat Ring Road Fruit Mandi"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#384959] uppercase mb-0.5 font-heading">
                          City
                        </label>
                        <input
                          type="text"
                          value={dest.city}
                          onChange={(e) => {
                            const updated = [...destinations];
                            updated[destIdx].city = e.target.value;
                            setDestinations(updated);
                          }}
                          className="w-full bg-white border border-[#DCE8F2] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                          placeholder="e.g. Surat, Vapi, Vadodara, Ahmedabad"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#384959] uppercase mb-0.5 font-heading">
                          Destination State (Set State)
                        </label>
                        <select
                          value={dest.state || ''}
                          onChange={(e) => {
                            const updated = [...destinations];
                            updated[destIdx].state = e.target.value;
                            setDestinations(updated);
                          }}
                          className="w-full bg-white border border-[#DCE8F2] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                        >
                          <option value="">-- Select Destination State --</option>
                          <option value="Gujarat">Gujarat</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Rajasthan">Rajasthan</option>
                          <option value="Madhya Pradesh">Madhya Pradesh</option>
                          <option value="Goa">Goa</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Other">Other State</option>
                        </select>
                      </div>
                    </div>

                    {/* Items List (Auto Calculation: Quantity * Cost = Total) */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-[#384959] uppercase font-heading">
                          Fruit Items (Auto-Calculated)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddItem(destIdx)}
                          className="text-[#6A89A7] font-bold hover:text-[#384959] flex items-center gap-0.5 text-[11px] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Item</span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {dest.items.map((item, itemIdx) => (
                          <div
                            key={item.id}
                            className="grid grid-cols-12 gap-2 bg-white p-2.5 rounded-xl border border-[#DCE8F2] items-center"
                          >
                            <div className="col-span-5">
                              <input
                                type="text"
                                value={item.itemName}
                                onChange={(e) =>
                                  handleItemChange(destIdx, itemIdx, 'itemName', e.target.value)
                                }
                                placeholder="Item Name (e.g. Alphonso Mango Box)"
                                className="w-full bg-transparent border-none text-xs text-[#384959] font-medium p-0 focus:ring-0"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    destIdx,
                                    itemIdx,
                                    'quantity',
                                    Number(e.target.value)
                                  )
                                }
                                placeholder="Qty"
                                className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-lg px-2 py-1 text-xs font-mono font-bold text-[#384959] text-center focus:outline-none focus:border-[#88BDF2]"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                min="1"
                                value={item.costPerItem}
                                onChange={(e) =>
                                  handleItemChange(
                                    destIdx,
                                    itemIdx,
                                    'costPerItem',
                                    Number(e.target.value)
                                  )
                                }
                                placeholder="Cost"
                                className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-lg px-2 py-1 text-xs font-mono font-bold text-[#384959] text-center focus:outline-none focus:border-[#88BDF2]"
                              />
                            </div>
                            <div className="col-span-2 text-right font-mono font-bold text-[#384959]">
                              ₹{item.totalAmount}
                            </div>
                            <div className="col-span-1 text-center">
                              {dest.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(destIdx, itemIdx)}
                                  className="text-slate-300 hover:text-rose-600 cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-right text-xs font-bold text-[#384959] mt-1">
                        Subtotal: <span className="font-mono text-[#384959] font-extrabold">₹{dest.destinationTotalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#DCE8F2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTripModalOpen(false)}
                  className="px-4 py-2 font-bold text-[#384959] bg-[#F0F4F8] hover:bg-[#DCE8F2] rounded-xl cursor-pointer font-heading transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#384959] hover:bg-[#2C3A47] rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer font-heading transition-all"
                >
                  <Truck className="w-4 h-4" />
                  <span>Dispatch Trip to Gujarat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: EDIT OUTBOUND FRUIT DELIVERY PLACES IN GUJARAT (User Requirement) */}
      {editingTripForDestinations && (
        <div className="fixed inset-0 z-50 bg-[#384959]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#DCE8F2] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-xs animate-in fade-in duration-100">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#384959] text-white flex items-center justify-between border-b border-[#2C3A47]">
              <div>
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#BDDDFC]" />
                  <h3 className="font-heading font-extrabold text-sm tracking-tight text-white">
                    Edit Outbound Fruit Delivery Places & Items ({editingTripForDestinations.id})
                  </h3>
                  <span className="bg-[#BDDDFC]/20 text-[#BDDDFC] text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#BDDDFC]/30 font-bold">
                    {editingTripForDestinations.vehicleNumber}
                  </span>
                </div>
                <p className="text-[11px] text-[#BDDDFC] mt-0.5">
                  Driver: <strong>{editingTripForDestinations.driverName}</strong> • Origin: {editingTripForDestinations.startingLocation} • Out Date: {editingTripForDestinations.outDate}
                </p>
              </div>
              <button
                onClick={() => setEditingTripForDestinations(null)}
                className="text-[#BDDDFC] hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditedDestinations} onKeyDown={(e) => handleFormKeyDown(e)} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Top Summary Bar */}
              <div className="p-3.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-extrabold text-[#384959] text-xs">
                      Delivered Locations:
                    </span>
                    <span className="bg-white px-2.5 py-0.5 rounded-full border border-[#DCE8F2] font-mono font-bold text-[#384959] text-xs">
                      {editDestinations.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#6A89A7] flex items-center gap-1 mt-1 flex-wrap">
                    <Navigation className="w-3 h-3 text-[#6A89A7]" />
                    <span className="font-semibold text-[#384959]">Corridor Sequence:</span>
                    <span className="font-mono font-bold text-[#384959]">
                      {editingTripForDestinations.startingLocation.split(' ')[0]} → {editDestinations.map((d) => d.city || 'Place').join(' → ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#6A89A7] block font-heading">
                      Recalculated Fruit Value:
                    </span>
                    <span className="font-mono text-sm font-black text-[#384959]">
                      ₹{currentEditTotalFruitValue.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {editDestinations.length < 8 && (
                    <button
                      type="button"
                      onClick={() => handleEditAddDestinationPlace()}
                      className="px-3.5 py-1.5 text-xs font-bold text-[#384959] bg-[#BDDDFC]/50 hover:bg-[#BDDDFC]/80 border border-[#BDDDFC] rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer font-heading transition-all"
                      title="Add one more delivered location"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Place</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Destinations List */}
              <div className="space-y-4">
                {editDestinations.map((dest, destIdx) => (
                  <div
                    key={dest.id}
                    className="p-4 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl space-y-3 shadow-xs"
                  >
                    {/* Destination Title & Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#DCE8F2]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-full bg-[#6A89A7] text-white font-mono text-xs font-bold flex items-center justify-center">
                          {destIdx + 1}
                        </span>
                        <span className="font-heading font-extrabold text-[#384959] text-sm">
                          Location {destIdx + 1}: {dest.city || 'Gujarat City'}
                        </span>
                        {destIdx === editDestinations.length - 1 && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.2 rounded-full font-heading">
                            Last Delivery Location
                          </span>
                        )}

                        {/* Reordering Controls: Move Up / Move Down */}
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            onClick={() => handleEditMoveDestination(destIdx, 'up')}
                            disabled={destIdx === 0}
                            className="p-1 rounded bg-white border border-[#DCE8F2] hover:bg-[#F0F4F8] disabled:opacity-30 disabled:hover:bg-white text-[#384959] cursor-pointer disabled:cursor-not-allowed"
                            title="Move earlier in delivery route sequence"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditMoveDestination(destIdx, 'down')}
                            disabled={destIdx === editDestinations.length - 1}
                            className="p-1 rounded bg-white border border-[#DCE8F2] hover:bg-[#F0F4F8] disabled:opacity-30 disabled:hover:bg-white text-[#384959] cursor-pointer disabled:cursor-not-allowed"
                            title="Move later in delivery route sequence"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Toggle */}
                        <select
                          value={dest.deliveryStatus}
                          onChange={(e) =>
                            handleEditDestFieldChange(destIdx, 'deliveryStatus', e.target.value)
                          }
                          className="bg-white border border-[#DCE8F2] rounded-lg px-2.5 py-1 text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                        >
                          <option value="pending">⏳ Pending Delivery</option>
                          <option value="delivered">✓ Delivered</option>
                        </select>

                        {/* Remove Place Button */}
                        {editDestinations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleEditRemoveDestinationPlace(destIdx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            title="Remove this destination place"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Place Name, City, State, Contact Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-[#384959] uppercase mb-0.5 font-heading">
                          Market / Place Name
                        </label>
                        <input
                          type="text"
                          required
                          value={dest.placeName}
                          onChange={(e) =>
                            handleEditDestFieldChange(destIdx, 'placeName', e.target.value)
                          }
                          className="w-full bg-white border border-[#DCE8F2] rounded-xl px-2.5 py-1.5 text-xs text-[#384959] font-semibold focus:outline-none focus:border-[#88BDF2]"
                          placeholder="e.g. Ring Road Fruit Mandi"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#384959] uppercase mb-0.5 font-heading">
                          City
                        </label>
                        <input
                          type="text"
                          required
                          value={dest.city}
                          onChange={(e) =>
                            handleEditDestFieldChange(destIdx, 'city', e.target.value)
                          }
                          className="w-full bg-white border border-[#DCE8F2] rounded-xl px-2.5 py-1.5 text-xs text-[#384959] font-bold focus:outline-none focus:border-[#88BDF2]"
                          placeholder="e.g. Surat, Vapi, Vadodara"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#384959] uppercase mb-0.5 font-heading">
                          Destination State (Set State)
                        </label>
                        <select
                          value={dest.state || ''}
                          onChange={(e) =>
                            handleEditDestFieldChange(destIdx, 'state', e.target.value)
                          }
                          className="w-full bg-white border border-[#DCE8F2] rounded-xl px-2.5 py-1.5 text-xs text-[#384959] font-bold focus:outline-none focus:border-[#88BDF2]"
                        >
                          <option value="">-- Select State --</option>
                          <option value="Gujarat">Gujarat</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Rajasthan">Rajasthan</option>
                          <option value="Madhya Pradesh">Madhya Pradesh</option>
                          <option value="Goa">Goa</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Other">Other State</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#384959] uppercase mb-0.5 font-heading">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          value={dest.contactPerson}
                          onChange={(e) =>
                            handleEditDestFieldChange(destIdx, 'contactPerson', e.target.value)
                          }
                          className="w-full bg-white border border-[#DCE8F2] rounded-xl px-2.5 py-1.5 text-xs text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                          placeholder="e.g. Kantilal Shah"
                        />
                      </div>
                    </div>

                    {/* Payment Terms & Quick Reminder */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 bg-white rounded-xl border border-[#DCE8F2]">
                      <div>
                        <label className="block text-[10px] font-bold text-[#384959] uppercase mb-0.5 font-heading">
                          Payment Term (How & When Party Pays for Fruit)
                        </label>
                        <select
                          value={dest.paymentTerm}
                          onChange={(e) =>
                            handleEditDestFieldChange(destIdx, 'paymentTerm', e.target.value)
                          }
                          className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                        >
                          <option value="immediate">Immediate Payment (On Unloading)</option>
                          <option value="1_month">Gives Payment in 1 Month (30 Days)</option>
                          <option value="2_months">Gives Payment in 2 Months (60 Days)</option>
                          <option value="3_months">Gives Payment in 3 Months (90 Days)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#384959] uppercase mb-0.5 font-heading">
                          Quick Reminder Date
                        </label>
                        <input
                          type="date"
                          value={dest.quickReminderDate || ''}
                          onChange={(e) =>
                            handleEditDestFieldChange(destIdx, 'quickReminderDate', e.target.value)
                          }
                          className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                        />
                      </div>
                    </div>

                    {/* Fruit Items List with Live Calculation: Quantity * Cost = Subtotal */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#384959] uppercase font-heading">
                          Fruit Items for this Place (Auto Calculated: Quantity × Cost)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEditAddItem(destIdx)}
                          className="text-[#6A89A7] font-bold hover:text-[#384959] flex items-center gap-1 text-xs cursor-pointer font-heading"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Fruit Item</span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {dest.items.map((item, itemIdx) => (
                          <div
                            key={item.id}
                            className="grid grid-cols-12 gap-2 bg-white p-2.5 rounded-xl border border-[#DCE8F2] items-center"
                          >
                            <div className="col-span-5">
                              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">
                                Fruit Item Name
                              </label>
                              <input
                                type="text"
                                required
                                value={item.itemName}
                                onChange={(e) =>
                                  handleEditItemChange(destIdx, itemIdx, 'itemName', e.target.value)
                                }
                                placeholder="e.g. Alphonso Mango (24kg Box)"
                                className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-lg px-2 py-1 text-xs font-medium text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5 text-center">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min="1"
                                required
                                value={item.quantity}
                                onChange={(e) =>
                                  handleEditItemChange(
                                    destIdx,
                                    itemIdx,
                                    'quantity',
                                    Number(e.target.value)
                                  )
                                }
                                placeholder="30"
                                className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-[#384959] text-center focus:outline-none focus:border-[#88BDF2]"
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5 text-center">
                                Cost / Item (₹)
                              </label>
                              <input
                                type="number"
                                min="1"
                                required
                                value={item.costPerItem}
                                onChange={(e) =>
                                  handleEditItemChange(
                                    destIdx,
                                    itemIdx,
                                    'costPerItem',
                                    Number(e.target.value)
                                  )
                                }
                                placeholder="30"
                                className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-[#384959] text-center focus:outline-none focus:border-[#88BDF2]"
                              />
                            </div>

                            <div className="col-span-2 text-right">
                              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">
                                Total (₹)
                              </label>
                              <div className="font-mono font-bold text-[#384959] text-xs py-1">
                                ₹{item.totalAmount}
                              </div>
                            </div>

                            <div className="col-span-1 text-center pt-3">
                              {dest.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleEditRemoveItem(destIdx, itemIdx)}
                                  className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer"
                                  title="Delete item"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-right text-xs font-bold text-[#384959] pt-1">
                        Place Subtotal: <span className="font-mono text-[#384959] font-extrabold text-sm">₹{dest.destinationTotalAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#DCE8F2] flex items-center justify-between">
                <div className="text-xs text-[#384959]">
                  Total Delivery Value: <strong className="font-mono text-[#384959] text-sm">₹{currentEditTotalFruitValue.toLocaleString('en-IN')}</strong> across {editDestinations.length} places
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTripForDestinations(null)}
                    className="px-4 py-2 font-bold text-[#384959] bg-[#F0F4F8] rounded-xl hover:bg-[#DCE8F2] cursor-pointer font-heading transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-white bg-[#384959] hover:bg-[#2C3A47] rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer font-heading transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Updated Places & Recalculate</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Return Load with Multi-Location Delivery (User Requirement: How many location to delivered on which location) */}
      {selectedTripForReturn && (
        <div className="fixed inset-0 z-50 bg-[#384959]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#DCE8F2] shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-xs animate-in fade-in duration-100">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#384959] text-white flex items-center justify-between border-b border-[#2C3A47]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Repeat className="w-5 h-5 text-[#BDDDFC]" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm tracking-tight text-white">
                    {selectedTripForReturn.returnLoad
                      ? `Edit Gujarat Return Load (Trip: ${selectedTripForReturn.id})`
                      : `Add Gujarat Return Load (Trip: ${selectedTripForReturn.id})`}
                  </h3>
                  <p className="text-[11px] text-[#BDDDFC] mt-0.5">
                    Vehicle: <strong>{selectedTripForReturn.vehicleNumber}</strong> • Driver: {selectedTripForReturn.driverName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTripForReturn(null)}
                className="text-[#BDDDFC] hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveReturnLoad} onKeyDown={(e) => handleFormKeyDown(e)} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Party & Gujarat Loading City */}
              <div className="p-4 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl space-y-3">
                <span className="text-[11px] font-extrabold uppercase text-[#384959] tracking-wider block font-heading">
                  Gujarat Consignor & Freight Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                      Loading Party Name (In Gujarat)
                    </label>
                    <input
                      type="text"
                      required
                      value={returnParty}
                      onChange={(e) => setReturnParty(e.target.value)}
                      placeholder="e.g. Surat Royal Textile Mills Ltd"
                      className="w-full bg-white border border-[#DCE8F2] rounded-xl px-3 py-2 font-bold text-[#384959] text-xs focus:outline-none focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                      Loading City (In Gujarat)
                    </label>
                    <select
                      value={returnLoadingCity}
                      onChange={(e) => setReturnLoadingCity(e.target.value)}
                      className="w-full bg-white border border-[#DCE8F2] rounded-xl px-3 py-2 text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                    >
                      <option value="Surat">Surat (Textiles, Chemical & Diamond Hub)</option>
                      <option value="Vapi">Vapi (Industrial GIDC & Packaging)</option>
                      <option value="Ahmedabad">Ahmedabad (Naroda APMC / Ceramics)</option>
                      <option value="Bharuch">Bharuch (Heavy Chemicals & Fertilisers)</option>
                      <option value="Vadodara">Vadodara (Engineering Spares & Plastics)</option>
                      <option value="Ankleshwar">Ankleshwar (Pharma & Chemicals)</option>
                      <option value="Rajkot">Rajkot (Foundry & Auto Parts)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                      Goods Description
                    </label>
                    <input
                      type="text"
                      required
                      value={returnGoods}
                      onChange={(e) => setReturnGoods(e.target.value)}
                      placeholder="e.g. Cotton Textile Bales, Ceramic Tiles"
                      className="w-full bg-white border border-[#DCE8F2] rounded-xl px-3 py-2 text-xs text-[#384959] font-medium focus:outline-none focus:border-[#88BDF2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                      Total Weight (KG)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={returnTotalWeight || ''}
                      onChange={(e) => setReturnTotalWeight(Number(e.target.value))}
                      placeholder="e.g. 12000"
                      className="w-full bg-white border border-[#DCE8F2] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                      Total Quantity (Units / Bales)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={returnTotalQty || ''}
                      onChange={(e) => setReturnTotalQty(Number(e.target.value))}
                      placeholder="e.g. 85"
                      className="w-full bg-white border border-[#DCE8F2] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Drop Delivery Locations: How Many Locations to Deliver & Which Locations */}
              <div className="p-4 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#DCE8F2]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#6A89A7]" />
                    <div>
                      <span className="text-[11px] font-extrabold text-[#384959] uppercase tracking-wide block font-heading">
                        How Many Locations to Deliver & Which Locations
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-[#6A89A7]">
                          How Many Delivered Locations:
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded-full border border-[#DCE8F2] font-mono font-bold text-[#384959] text-xs">
                          {returnDeliveryLocations.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddReturnLocation}
                    className="px-3.5 py-1.5 text-xs font-bold text-[#384959] bg-[#BDDDFC]/50 hover:bg-[#BDDDFC]/80 border border-[#BDDDFC] rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer font-heading self-start sm:self-auto transition-all"
                    title="Add one more delivered location"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Places</span>
                  </button>
                </div>

                {/* Delivery Locations Breakdown Cards */}
                <div className="space-y-3">
                  {returnDeliveryLocations.map((loc, locIdx) => (
                    <div
                      key={loc.id || locIdx}
                      className="p-3.5 bg-white rounded-xl border border-[#DCE8F2] space-y-2.5 shadow-xs"
                    >
                      {/* Location Header */}
                      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#DCE8F2]">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#6A89A7] text-white font-mono text-[10px] flex items-center justify-center font-bold">
                            {locIdx + 1}
                          </span>
                          <span className="font-heading font-extrabold text-[#384959] text-xs">
                            Location {locIdx + 1}: {loc.city || 'Maharashtra Destination'}
                          </span>
                          {locIdx === 0 && (
                            <span className="text-[9px] font-bold text-[#384959] bg-[#BDDDFC]/40 px-2 py-0.5 rounded-lg border border-[#BDDDFC]">
                              1st Unloading Point
                            </span>
                          )}
                          {locIdx === returnDeliveryLocations.length - 1 && returnDeliveryLocations.length > 1 && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
                              Final Destination
                            </span>
                          )}
                          {locIdx > 0 && locIdx < returnDeliveryLocations.length - 1 && (
                            <span className="text-[9px] font-bold text-[#6A89A7] bg-[#F0F4F8] px-2 py-0.5 rounded-lg border border-[#DCE8F2]">
                              Intermediate Drop
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Move Up / Move Down */}
                          <button
                            type="button"
                            onClick={() => handleMoveReturnLocation(locIdx, 'up')}
                            disabled={locIdx === 0}
                            className="p-1 rounded bg-white border border-[#DCE8F2] hover:bg-[#F0F4F8] disabled:opacity-30 text-[#384959] cursor-pointer disabled:cursor-not-allowed"
                            title="Unload earlier on route"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveReturnLocation(locIdx, 'down')}
                            disabled={locIdx === returnDeliveryLocations.length - 1}
                            className="p-1 rounded bg-white border border-[#DCE8F2] hover:bg-[#F0F4F8] disabled:opacity-30 text-[#384959] cursor-pointer disabled:cursor-not-allowed"
                            title="Unload later on route"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {/* Delete Drop Button */}
                          {returnDeliveryLocations.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveReturnLocation(locIdx)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded border border-rose-200 transition-colors cursor-pointer ml-1"
                              title="Remove this delivery location"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Location Details Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[9px] font-bold text-[#384959] uppercase mb-0.5 font-heading">
                            Which Location / Delivery City
                          </label>
                          <input
                            type="text"
                            required
                            value={loc.city}
                            onChange={(e) => handleReturnLocationChange(locIdx, 'city', e.target.value)}
                            placeholder="e.g. Bhiwandi, Pune, Mumbai, Nashik"
                            className="w-full bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-[#384959] uppercase mb-0.5 font-heading">
                            Godown / Unloading Place Name
                          </label>
                          <input
                            type="text"
                            required
                            value={loc.placeName}
                            onChange={(e) => handleReturnLocationChange(locIdx, 'placeName', e.target.value)}
                            placeholder="e.g. Central Godown, Market Yard Depot"
                            className="w-full bg-white border border-[#DCE8F2] rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-[#384959] uppercase mb-0.5 font-heading">
                            Consignee Contact Person & Mobile
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              value={loc.consigneeName || ''}
                              onChange={(e) => handleReturnLocationChange(locIdx, 'consigneeName', e.target.value)}
                              placeholder="Contact person"
                              className="w-full bg-white border border-[#DCE8F2] rounded-xl px-2 py-1.5 text-xs text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                            />
                            <input
                              type="text"
                              value={loc.mobile || ''}
                              onChange={(e) => handleReturnLocationChange(locIdx, 'mobile', e.target.value)}
                              placeholder="+91 Mobile"
                              className="w-full bg-white border border-[#DCE8F2] rounded-xl px-2 py-1.5 text-xs font-mono text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Route Summary */}
                <div className="p-3 bg-[#F0F4F8] border border-[#DCE8F2] rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Navigation className="w-3.5 h-3.5 text-[#6A89A7] shrink-0" />
                    <span className="font-heading font-bold text-[#384959]">Calculated Delivery Route:</span>
                    <span className="font-mono font-black text-[#384959]">
                      {returnLoadingCity} (GJ) → {returnDeliveryLocations.map((l) => l.city || 'Location').join(' → ')} ({returnDeliveryLocations.length} Delivered Locations)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono font-bold text-[#384959] text-[11px]">
                    <span>
                      Total Qty: <strong>{returnTotalQty}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Total Wt: <strong>{(returnTotalWeight || 0).toLocaleString()} KG</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Set Rent of Load & LR Details */}
              <div className="p-4 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl space-y-3">
                <span className="text-[11px] font-extrabold uppercase text-[#384959] tracking-wider block font-heading">
                  Freight Charge, LR & Payment Terms
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                      Rent of Load (Charge in ₹)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={loadRentCharge}
                      onChange={(e) => setLoadRentCharge(Number(e.target.value))}
                      className="w-full bg-white border border-[#DCE8F2] rounded-xl px-3 py-2 font-mono font-black text-sm text-[#384959] focus:outline-none focus:border-[#88BDF2] focus:ring-2 focus:ring-[#88BDF2]/20"
                      placeholder="10500"
                    />
                    <span className="text-[9px] text-[#6A89A7] block mt-0.5">
                      Example: ₹10,500. Settle later to tag as <strong>(Settled)</strong>.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                      LR Number
                    </label>
                    <input
                      type="text"
                      required
                      value={returnLRNumber}
                      onChange={(e) => setReturnLRNumber(e.target.value)}
                      className="w-full bg-white border border-[#DCE8F2] rounded-xl px-3 py-2 font-mono font-bold text-xs text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                      Payment Reminder Date
                    </label>
                    <input
                      type="date"
                      value={returnReminderDate}
                      onChange={(e) => setReturnReminderDate(e.target.value)}
                      className="w-full bg-white border border-[#DCE8F2] rounded-xl px-3 py-2 font-mono text-xs text-[#384959] focus:outline-none focus:border-[#88BDF2]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#DCE8F2]">
                <span className="text-xs text-[#6A89A7]">
                  Delivering across <strong className="text-[#384959]">{returnDeliveryLocations.length} location(s)</strong> with verified LR tracking
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTripForReturn(null)}
                    className="px-4 py-2 font-bold text-[#384959] bg-[#F0F4F8] rounded-xl hover:bg-[#DCE8F2] cursor-pointer font-heading transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-white bg-[#384959] hover:bg-[#2C3A47] rounded-xl shadow-xs cursor-pointer font-heading flex items-center gap-1.5 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {selectedTripForReturn.returnLoad ? 'Update Return Load' : 'Save Return Load'} ({returnDeliveryLocations.length} Delivery Locations)
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Settle Return Load Payment with (Settled) Tag */}
      {settlingTrip && settlingTrip.returnLoad && (
        <div className="fixed inset-0 z-50 bg-[#384959]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#DCE8F2] shadow-2xl w-full max-w-md p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#DCE8F2] pb-3">
              <h3 className="font-heading font-bold text-sm text-[#384959]">
                Settle Payment for {settlingTrip.returnLoad.loadingPartyName}
              </h3>
              <button onClick={() => setSettlingTrip(null)} className="text-slate-400 hover:text-[#384959] cursor-pointer">✕</button>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] border border-[#DCE8F2] rounded-xl space-y-1">
              <span className="text-[10px] text-[#6A89A7] font-bold uppercase block font-heading">Original Charge:</span>
              <div className="font-mono text-lg font-black text-[#384959]">
                ₹{settlingTrip.returnLoad.loadRentCharge.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-600 block">
                LR #: <strong>{settlingTrip.returnLoad.lrNumber}</strong>
              </span>
            </div>

            <form onSubmit={handleConfirmSettlement} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#384959] mb-1 font-heading">
                  Settled Amount (In ₹)
                </label>
                <input
                  type="number"
                  required
                  value={settledAmountInput}
                  onChange={(e) => setSettledAmountInput(Number(e.target.value))}
                  className="w-full bg-white border border-emerald-400 rounded-xl px-3 py-2 font-mono font-bold text-base text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-[11px]">
                Upon saving, this load will display: <strong>Charge is ₹{settlingTrip.returnLoad.loadRentCharge.toLocaleString('en-IN')} and Settled in ₹{settledAmountInput.toLocaleString('en-IN')}</strong> with the tag <strong className="text-emerald-700 font-black">(Settled)</strong>.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#DCE8F2]">
                <button
                  type="button"
                  onClick={() => setSettlingTrip(null)}
                  className="px-4 py-2 font-bold text-[#384959] bg-[#F0F4F8] hover:bg-[#DCE8F2] rounded-xl cursor-pointer font-heading transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs cursor-pointer font-heading transition-all"
                >
                  Confirm & Tag as (Settled)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

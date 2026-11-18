import { MealSlot, MealSlotConfig, DeliverySlotOption } from '../types';
import { getConfiguredMealSlots } from '../services/configService'; // Updated import

/**
 * Calculates the exact delivery start time and cutoff time for a slot on a given reference date.
 */
export const calculateDeliveryAndCutoffTimes = (slotConfig: MealSlotConfig, referenceDate: Date): { deliveryStartTime: Date, cutoffTime: Date } => {
  const deliveryStartTime = new Date(referenceDate);
  deliveryStartTime.setHours(slotConfig.deliveryHour, 0, 0, 0); // Set to start of delivery hour

  const cutoffTime = new Date(deliveryStartTime);
  cutoffTime.setHours(cutoffTime.getHours() - slotConfig.cutoffHoursBeforeDelivery);

  return { deliveryStartTime, cutoffTime };
};

/**
 * Formats a date and MealSlotConfig into a user-friendly display string.
 * Example: "Today - Dinner (7:00 PM - 9:00 PM)"
 */
const formatSlotLabel = (date: Date, slotConfig: MealSlotConfig, now: Date): string => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  let dayLabel = '';
  if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()) {
    dayLabel = 'Today';
  } else if (date.getFullYear() === tomorrow.getFullYear() && date.getMonth() === tomorrow.getMonth() && date.getDate() === tomorrow.getDate()) {
    dayLabel = 'Tomorrow';
  } else {
    dayLabel = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  // Use the dynamically generated displayWindow from the slotConfig
  return `${dayLabel} - ${slotConfig.name} (${slotConfig.displayWindow})`;
};


/**
 * Generates a list of available delivery slots for today and tomorrow.
 * Respects the cutoff times for ordering.
 */
export const getAvailableDeliverySlots = (now: Date): DeliverySlotOption[] => {
  const MEAL_SLOTS_CONFIG = getConfiguredMealSlots(); // Fetch dynamic config
  const availableSlots: DeliverySlotOption[] = [];
  const today = new Date(now);
  today.setHours(0, 0, 0, 0); // Normalize to start of day for date comparisons

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Check for today's slots
  MEAL_SLOTS_CONFIG.forEach(slotConfig => {
    const { cutoffTime } = calculateDeliveryAndCutoffTimes(slotConfig, today);
    if (now < cutoffTime) { // If current time is before cutoff for this slot today
      const slotDate = new Date(today); // Ensure it's a new date object for the slot
      slotDate.setHours(slotConfig.deliveryHour, 0,0,0);

      availableSlots.push({
        key: `${today.toISOString().split('T')[0]}_${slotConfig.name}`,
        date: slotDate,
        slot: slotConfig.name,
        label: formatSlotLabel(today, slotConfig, now),
        config: slotConfig,
      });
    }
  });

  // Add all of tomorrow's slots
  MEAL_SLOTS_CONFIG.forEach(slotConfig => {
    const slotDate = new Date(tomorrow);
    slotDate.setHours(slotConfig.deliveryHour, 0,0,0);
    availableSlots.push({
      key: `${tomorrow.toISOString().split('T')[0]}_${slotConfig.name}`,
      date: slotDate,
      slot: slotConfig.name,
      label: formatSlotLabel(tomorrow, slotConfig, now),
      config: slotConfig,
    });
  });
  
  // Sort slots chronologically
  availableSlots.sort((a, b) => {
    const aTime = new Date(a.date);
    aTime.setHours(a.config.deliveryHour, 0,0,0);
    const bTime = new Date(b.date);
    bTime.setHours(b.config.deliveryHour, 0,0,0);
    return aTime.getTime() - bTime.getTime();
  });

  // Deduplicate slots based on key (in case logic adds something twice, though current setup shouldn't)
  const uniqueSlots = Array.from(new Map(availableSlots.map(slot => [slot.key, slot])).values());

  return uniqueSlots;
};
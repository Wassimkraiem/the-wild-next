'use server';

import { revalidatePath } from 'next/cache';
import { revalidate } from '../about/page';
import { auth, signIn, signOut } from './auth';
import { supabase } from './supabase';
import { getBookings } from './data-service';
import { redirect } from 'next/navigation';

export async function createBooking(bookingData, formData) {
	const session = await auth();
	if (!session) throw new Error('u must be logged in');

	const newBooking = {
		...bookingData,
		guestId: session.user.guestId,
		numGuests: Number(formData.get('numGuests')),
		observations: formData.get('observations').slice(0, 1000),
		extrasPrice: 0,
		totalPrice: bookingData.cabinPrice,
		isPaid: false,
		hasBreakfast: false,
		status: 'unconfirmed',
	};
	const { data, error } = await supabase
		.from('bookings')
		.insert([newBooking])
		// So that the newly created object gets returned!
		.select()
		.single();

	if (error) {
		console.error(error);
		throw new Error('Booking could not be created');
	}
	revalidatePath(`/cabins/${newBooking.cabinId}`);
	redirect('/cabins/thankyou');
}

export async function updateBooking(formData) {
	const session = await auth();
	if (!session) throw new Error('u must be logged in');
	const bookingId = Number(formData.get('bookingId'));
	const guestBookings = await getBookings(session.user.guestId);
	const guestBookingsList = guestBookings.map((booking) => booking.id);
	if (!guestBookingsList.includes(bookingId))
		throw new Error("you're not allowed to delete this booking");

	const updatedBooking = {
		numGuests: Number(formData.get('numGuests')),
		observations: formData.get('observations').slice(0, 1000),
	};
	const { error } = await supabase
		.from('bookings')
		.update(updatedBooking)
		.eq('id', bookingId)
		.select();
	if (error) throw new Error(error.message);
	revalidatePath(`/account/reservations/edit/${bookingId}`);
	redirect('/account/reservations');
}

export async function updateProfile(formData) {
	const session = await auth();
	if (!session) throw new Error('u must be logged in');
	const nationalID = formData.get('nationalID');
	const [nationality, countryFlag] = formData.get('nationality').split('%');
	const regex = /^[a-zA-Z0-9]{6,12}$/;
	if (!regex.test(nationalID))
		throw new Error('please enter a valid national id');

	const updateData = { nationality, nationalID, countryFlag };
	const { data, error } = await supabase
		.from('guests')
		.update(updateData)
		.eq('id', session.user.guestId)
		.select()
		.single();
	if (error) throw new Error('guest could not be updated');
	revalidatePath('/account/profile');
}

export async function deleteReservation(bookingID) {
	const session = await auth();
	if (!session) throw new Error('u must be logged in');
	const guestBookings = await getBookings(session.user.guestId);
	const guestBookingsList = guestBookings.map((booking) => booking.id);
	if (!guestBookingsList.includes(bookingID))
		throw new Error("you're not allowed to delete this booking");
	const { data, error } = await supabase
		.from('bookings')
		.delete()
		.eq('id', bookingID);
	if (error) throw new Error('booking could not be deleted');
	revalidatePath('/account/reservations');
}

export async function signInAction() {
	await signIn('google', { redirectTo: '/account' });
}

export async function signOutAction() {
	await signOut({ redirectTo: '/' });
}

import { WishDTO } from "shared-schemas";
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient();
const RED_DOT_IMAGE = new Uint8Array([
	137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 5, 0, 0, 0,
	5, 8, 6, 0, 0, 0, 141, 111, 38, 229, 0, 0, 0, 28, 73, 68, 65, 84, 8, 215, 99, 248,
	255, 255, 63, 195, 127, 6, 32, 5, 195, 32, 18, 132, 208, 49, 241, 130, 88, 205, 4,
	0, 14, 245, 53, 203, 209, 142, 14, 31, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
])
const DATE_NOW = new Date().toISOString();
describe('api-db', () => {

	const NB_WISHES_IN = 10;
	beforeEach(async () => {
		// Cleaning

		await prisma.wish.deleteMany({});


		for (let i = 0; i < NB_WISHES_IN; i++) {
			await prisma.wish.create({
				data: {
					name: `name for ${String(i)}`,
					comment: `comment for ${String(i)}`,
					createdAt: DATE_NOW,
					tags: [`tag-for-${String(i)}`, "tag1", "tag2", "tag3", "tag4"],
					picture: RED_DOT_IMAGE,
				}
			})
		}
	});

	afterEach(async () => {
		await prisma.wish.deleteMany({});
	});

	it('GET /all-wishes should return the right number of elements, all respecting the schema ', async () => {
		const res = await fetch("http://localhost:3000/all-wishes")
		const wishes_received = await res.json();
		expect(wishes_received.length).toBe(NB_WISHES_IN);

		const wishes_received_parsed = WishDTO.array().safeParse(wishes_received);
		if (wishes_received_parsed.data) {
			expect(wishes_received_parsed.data.length).toEqual(NB_WISHES_IN);
		}
		else {
			fail(wishes_received_parsed.error);
		}
	})

	it('POST /new-wish should create a new wish in the database and return a 204 code', async () => {

		const wishCount_before = await prisma.wish.count();

		const res = await fetch("http://localhost:3000/new-wish", {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				createdAt: DATE_NOW,
				name: 'new-wish-test',
				comment: 'new wish comment',
				tags: ['new wish tag'],
				picture: Buffer.from(RED_DOT_IMAGE).toString('base64')
			})
		});
		expect(res.status).toBe(204)

		const wishCount_now = await prisma.wish.count();
		expect(wishCount_now).toBe(wishCount_before + 1);
	})

	it('PATCH /update-wish should update a wish in the database and return the updated wish', async () => {
		const wishToUpdate = await prisma.wish.findFirstOrThrow();
		wishToUpdate.comment = "modified comment"
		wishToUpdate.tags.push('added tag')

		const res = await fetch("http://localhost:3000/update-wish", {
			method: 'PATCH',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				...wishToUpdate,
				picture: wishToUpdate.picture ? Buffer.from(wishToUpdate.picture).toString('base64') : null
			})
		});
		expect(res.status).toBe(200)

		const wish_updated = await prisma.wish.findUniqueOrThrow({
			where: { id: wishToUpdate.id }
		})
		expect(wishToUpdate.comment).toEqual(wish_updated.comment)
	})
	it('DELETE /delete-wish should delete a wish in the database and return a 204 code', async () => {

		const wishCount_before = await prisma.wish.count();
		const wishToDelete = await prisma.wish.findFirstOrThrow();
		const res = await fetch(`http://localhost:3000/delete-wish/${wishToDelete.id}`, {
			method: 'DELETE',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
		});
		expect(res.status).toBe(204)

		const wishCount_now = await prisma.wish.count();
		expect(wishCount_now).toBe(wishCount_before - 1);


		const thisWishHaveBeenDeleted = await prisma.wish.findUnique({
			where: {
				id: wishToDelete.id,
			},
		})
		expect(thisWishHaveBeenDeleted).toBeNull()
	})


});;

describe('prismaORM', () => {
	beforeEach(async () => {
		await prisma.wish.deleteMany({});
	});

	afterEach(async () => {
		await prisma.wish.deleteMany({});
	});

	it('should add a wish', async () => {
		const wishCount_before = await prisma.wish.count();
		await prisma.wish.create({
			data: {
				name: 'test-name',
				comment: 'test-comment',
				createdAt: DATE_NOW,
				tags: ['test-tag'],
				picture: new Uint8Array()
			}
		})
		const wishCount_now = await prisma.wish.count();
		expect(wishCount_now).toBe(wishCount_before + 1);
	});
	it('should delete a wish', async () => {
		const wish_added = await prisma.wish.create({
			data: {
				name: 'test-name',
				comment: 'test-comment',
				createdAt: DATE_NOW,
				tags: ['test-tag'],
				picture: new Uint8Array()
			}
		})
		const wishCount_before = await prisma.wish.count();
		await prisma.wish.delete({
			where: {
				id: wish_added.id
			},
		})
		const wishCount_now = await prisma.wish.count();
		expect(wishCount_now).toBe(wishCount_before - 1);
	});
})
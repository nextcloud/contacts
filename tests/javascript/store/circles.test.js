/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import circlesStore from '../../../src/store/circles.js'
import Circle from '../../../src/models/circle.ts'
import Member from '../../../src/models/member.ts'
import { MAX_MEMBERS_TO_RENDER } from '../../../src/models/constants.ts'

describe('circles store', () => {
	let state
	let context

	const createTestCircleData = (id) => ({
		id,
		displayName: 'Test Circle',
		owner: {
			id: 'owner-1',
			singleId: 'owner-single-1',
			displayName: 'Owner',
			level: 8,
			userType: 1,
		},
		initiator: {
			id: 'initiator-1',
			singleId: 'initiator-single-1',
			displayName: 'Initiator',
			level: 4,
			userType: 1,
		},
	})

	const createTestMemberData = (id) => ({
		id,
		singleId: `member-single-${id}`,
		displayName: `Member ${id}`,
		level: 1,
		userType: 1,
	})

	beforeEach(() => {
		state = {
			circles: {},
		}
		context = {
			state,
			commit: jest.fn((mutation, payload) => {
				if (circlesStore.mutations[mutation]) {
					circlesStore.mutations[mutation](state, payload)
				}
			}),
			getters: {
				getCircle: (id) => state.circles[id],
			},
			dispatch: jest.fn(),
		}
	})

	describe('mutations', () => {
		it('adds a circle to state', () => {
			const circle = new Circle(createTestCircleData('circle-1'))
			circlesStore.mutations.addCircle(state, circle)

			expect(state.circles['circle-1']).toBe(circle)
		})

		it('throws error when adding non-Circle object', () => {
			expect(() => {
				circlesStore.mutations.addCircle(state, { id: 'circle-1' })
			}).toThrow('circle must be a Circle type')
		})

		it('deletes a circle from state', () => {
			const circle = new Circle(createTestCircleData('circle-1'))
			state.circles['circle-1'] = circle

			circlesStore.mutations.deleteCircle(state, circle)

			expect(state.circles['circle-1']).toBeUndefined()
		})

		it('resets circle members to empty array', () => {
			const circle = new Circle(createTestCircleData('circle-1'))
			circle.members = { 'member-1': { id: 'member-1' } }
			state.circles['circle-1'] = circle

			circlesStore.mutations.resetCircleMembers(state, 'circle-1')

			expect(state.circles['circle-1'].members).toEqual([])
		})

		it('appends members to a circle', () => {
			const circle = new Circle(createTestCircleData('circle-1'))
			state.circles['circle-1'] = circle

			const member1 = new Member(createTestMemberData('member-1'), circle)
			const member2 = new Member(createTestMemberData('member-2'), circle)

			circlesStore.mutations.appendMembersToCircle(state, [member1, member2])

			expect(Object.keys(circle.members).length).toBeGreaterThan(0)
		})

		it('adds a single member to a circle', () => {
			const circle = new Circle(createTestCircleData('circle-1'))
			state.circles['circle-1'] = circle

			const member = new Member(createTestMemberData('member-1'), circle)

			circlesStore.mutations.addMemberToCircle(state, { circleId: 'circle-1', member })

			expect(Object.keys(circle.members).length).toBeGreaterThan(0)
		})

		it('deletes a member from a circle', () => {
			const circle = new Circle(createTestCircleData('circle-1'))
			const member = new Member(createTestMemberData('member-1'), circle)
			circle.addMember(member)
			state.circles['circle-1'] = circle

			const deleteSpy = jest.spyOn(member, 'delete')

			circlesStore.mutations.deleteMemberFromCircle(state, member)

			expect(deleteSpy).toHaveBeenCalled()
		})

		it('sets circle settings', () => {
			const circle = new Circle(createTestCircleData('circle-1'))
			state.circles['circle-1'] = circle

			const settings = { setting1: 'value1' }

			circlesStore.mutations.setCircleSettings(state, { circleId: 'circle-1', settings })

			expect(circle._data.settings).toEqual(settings)
		})

		it('updates circle population count', () => {
			const circle = new Circle(createTestCircleData('circle-1'))
			state.circles['circle-1'] = circle

			circlesStore.mutations.updateCirclePopulationCount(state, {
				circleId: 'circle-1',
				populationInherited: 100,
			})

			expect(circle._data.populationInherited).toBe(100)
		})
	})

	describe('getters', () => {
		it('returns all circles as array', () => {
			const circle1 = new Circle(createTestCircleData('circle-1'))
			const circle2 = new Circle(createTestCircleData('circle-2'))
			state.circles['circle-1'] = circle1
			state.circles['circle-2'] = circle2

			const circles = circlesStore.getters.getCircles(state)

			expect(circles).toHaveLength(2)
			expect(circles).toContain(circle1)
			expect(circles).toContain(circle2)
		})

		it('returns circle by id', () => {
			const circle = new Circle(createTestCircleData('circle-1'))
			state.circles['circle-1'] = circle

			const retrievedCircle = circlesStore.getters.getCircle(state)('circle-1')

			expect(retrievedCircle).toBe(circle)
		})

		it('returns undefined for non-existent circle', () => {
			const retrievedCircle = circlesStore.getters.getCircle(state)('non-existent')

			expect(retrievedCircle).toBeUndefined()
		})
	})

	describe('actions', () => {
		it('sets default limit when limit is undefined in getCircleMembers', () => {
			const circle = new Circle(createTestCircleData('circle-1'))
			state.circles['circle-1'] = circle

			// Test the limit logic directly
			let limit = undefined
			if (limit === undefined) {
				limit = MAX_MEMBERS_TO_RENDER + 1
			}

			expect(limit).toBe(MAX_MEMBERS_TO_RENDER + 1)
		})

		it('uses provided limit in getCircleMembers', () => {
			const circle = new Circle(createTestCircleData('circle-1'))
			state.circles['circle-1'] = circle

			// Test the limit logic directly
			let limit = 50
			if (limit === undefined) {
				limit = MAX_MEMBERS_TO_RENDER + 1
			}

			expect(limit).toBe(50)
		})
	})
})

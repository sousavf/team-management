/*
 * Team Management System
 * Copyright (C) 2025
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { startOfWeek, addWeeks } from 'date-fns';

const prisma = new PrismaClient();

const developers = [
  'FirstName Manager',
  'FirstName Developer'
];

async function seed() {
  console.log('Starting database seed...');

  try {
    await prisma.user.create({
      data: {
        email: 'admin@company.com',
        name: 'Team Manager',
        password: await bcrypt.hash('password123', 12),
        role: 'ADMIN'
      }
    });

    const users = await Promise.all(
      developers.map(async (name, index) => {
        const email = `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`;
        return prisma.user.create({
          data: {
            email,
            name,
            password: await bcrypt.hash('password123', 12),
            role: index < 2 ? 'MANAGER' : 'DEVELOPER'
          }
        });
      })
    );

    console.log(`Created ${users.length + 1} users`);

    await prisma.settings.createMany({
      data: [
        { key: 'PACE_FACTOR', value: '0.8' },
        { key: 'WORKING_HOURS_PER_DAY', value: '8' },
        { key: 'WORKING_DAYS_PER_WEEK', value: '5' }
      ]
    });

    const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const sampleAllocations = [];

    for (let i = 0; i < 4; i++) {
      const weekStart = addWeeks(currentWeek, i);
      
      for (const user of users.slice(0, 10)) {
        const allocation = {
          userId: user.id,
          weekStart,
          backendDevelopment: Math.floor(Math.random() * 50) + 20,
          frontendDevelopment: Math.floor(Math.random() * 30) + 10,
          codeReview: Math.floor(Math.random() * 20) + 5,
          releaseManagement: Math.floor(Math.random() * 15) + 5,
          ux: Math.floor(Math.random() * 10),
          technicalAnalysis: Math.floor(Math.random() * 15) + 5,
          devSupport: Math.floor(Math.random() * 10) + 2
        };

        const total = allocation.backendDevelopment + allocation.frontendDevelopment + 
                     allocation.codeReview + allocation.releaseManagement + 
                     allocation.ux + allocation.technicalAnalysis + allocation.devSupport;

        if (total <= 100) {
          sampleAllocations.push(allocation);
        }
      }
    }

    await prisma.allocation.createMany({
      data: sampleAllocations
    });

    console.log(`Created ${sampleAllocations.length} sample allocations`);

    const sampleTimeOffRequests = [
      {
        userId: users[0].id,
        startDate: addWeeks(currentWeek, 2),
        endDate: addWeeks(currentWeek, 2),
        type: 'VACATION' as const,
        reason: 'Personal vacation'
      },
      {
        userId: users[1].id,
        startDate: addWeeks(currentWeek, 1),
        endDate: addWeeks(currentWeek, 1),
        type: 'SICK_LEAVE' as const,
        reason: 'Medical appointment'
      },
      {
        userId: users[2].id,
        startDate: addWeeks(currentWeek, 3),
        endDate: addWeeks(currentWeek, 3),
        type: 'OTHER' as const,
        reason: 'Other time off'
      }
    ];

    await prisma.timeOffRequest.createMany({
      data: sampleTimeOffRequests
    });

    console.log(`Created ${sampleTimeOffRequests.length} sample time-off requests`);

    console.log('Database seed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@company.com / password123');
    console.log('All developers: [name]@company.com / password123');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
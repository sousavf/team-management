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

import nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

interface EmailRecipient {
  email: string;
  name: string;
}

interface TimeOffRequestInfo {
  id: string;
  employeeName: string;
  employeeEmail: string;
  startDate: Date;
  endDate: Date;
  type: string;
  reason?: string | null;
}

class EmailService {
  private transporter: Transporter | null = null;
  private fromName: string;
  private fromEmail: string;

  constructor() {
    this.fromName = process.env.SMTP_FROM_NAME || 'Team Management';
    this.fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@example.com';

    if (this.isConfigured()) {
      this.initializeTransporter();
    } else {
      console.warn('Email notifications disabled: SMTP not configured');
    }
  }

  private isConfigured(): boolean {
    return !!(
      process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true' &&
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT
    );
  }

  private initializeTransporter(): void {
    const secure = process.env.SMTP_SECURE === 'true';

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure,
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      } : undefined
    });

    console.log('Email service initialized successfully');
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private formatTimeOffType(type: string): string {
    const typeMap: Record<string, string> = {
      'VACATION': 'Vacation',
      'SICK_LEAVE': 'Sick Leave',
      'OTHER': 'Other'
    };
    return typeMap[type] || type;
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html
      });
      console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }

  async sendNewRequestNotification(
    manager: EmailRecipient,
    request: TimeOffRequestInfo
  ): Promise<void> {
    const subject = `New Time-Off Request from ${request.employeeName}`;
    const html = `
      <h2>New Time-Off Request</h2>
      <p>Hi ${manager.name},</p>
      <p><strong>${request.employeeName}</strong> has submitted a new time-off request that requires your attention.</p>
      <table style="border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatTimeOffType(request.type)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Start Date</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatDate(request.startDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>End Date</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatDate(request.endDate)}</td>
        </tr>
        ${request.reason ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reason</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${request.reason}</td>
        </tr>
        ` : ''}
      </table>
      <p>Please log in to the Team Management system to approve or reject this request.</p>
      <p>Best regards,<br>${this.fromName}</p>
    `;

    this.sendEmail(manager.email, subject, html);
  }

  async sendCancellationNotification(
    manager: EmailRecipient,
    request: TimeOffRequestInfo,
    cancellationReason?: string
  ): Promise<void> {
    const subject = `Time-Off Request Cancelled by ${request.employeeName}`;
    const html = `
      <h2>Time-Off Request Cancelled</h2>
      <p>Hi ${manager.name},</p>
      <p><strong>${request.employeeName}</strong> has cancelled their time-off request.</p>
      <table style="border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatTimeOffType(request.type)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Start Date</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatDate(request.startDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>End Date</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatDate(request.endDate)}</td>
        </tr>
        ${cancellationReason ? `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Cancellation Reason</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${cancellationReason}</td>
        </tr>
        ` : ''}
      </table>
      <p>Best regards,<br>${this.fromName}</p>
    `;

    this.sendEmail(manager.email, subject, html);
  }

  async sendApprovalNotification(
    employee: EmailRecipient,
    request: TimeOffRequestInfo,
    approverName: string
  ): Promise<void> {
    const subject = `Your Time-Off Request Has Been Approved`;
    const html = `
      <h2>Time-Off Request Approved</h2>
      <p>Hi ${employee.name},</p>
      <p>Great news! Your time-off request has been <strong style="color: green;">approved</strong> by ${approverName}.</p>
      <table style="border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatTimeOffType(request.type)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Start Date</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatDate(request.startDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>End Date</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatDate(request.endDate)}</td>
        </tr>
      </table>
      <p>Enjoy your time off!</p>
      <p>Best regards,<br>${this.fromName}</p>
    `;

    this.sendEmail(employee.email, subject, html);
  }

  async sendRejectionNotification(
    employee: EmailRecipient,
    request: TimeOffRequestInfo,
    approverName: string
  ): Promise<void> {
    const subject = `Your Time-Off Request Has Been Rejected`;
    const html = `
      <h2>Time-Off Request Rejected</h2>
      <p>Hi ${employee.name},</p>
      <p>Unfortunately, your time-off request has been <strong style="color: red;">rejected</strong> by ${approverName}.</p>
      <table style="border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Type</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatTimeOffType(request.type)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Start Date</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatDate(request.startDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>End Date</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${this.formatDate(request.endDate)}</td>
        </tr>
      </table>
      <p>Please contact your manager for more information or to discuss alternatives.</p>
      <p>Best regards,<br>${this.fromName}</p>
    `;

    this.sendEmail(employee.email, subject, html);
  }

  isEnabled(): boolean {
    return this.transporter !== null;
  }
}

export const emailService = new EmailService();

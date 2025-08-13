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

import { Version3Client } from 'jira.js';

export interface JiraTicket {
  key: string;
  summary: string;
  assigneeEmail: string;
  issueType: string;
  sprint: string;
}

class JiraService {
  private client: Version3Client | null = null;
  private ticketCache: Map<string, JiraTicket[]> = new Map();
  private pollInterval: NodeJS.Timeout | null = null;
  private readonly jiraUrl: string;
  private readonly pollIntervalSeconds: number;

  constructor() {
    this.jiraUrl = process.env.JIRA_URL || '';
    this.pollIntervalSeconds = parseInt(process.env.JIRA_POLL_INTERVAL_SECONDS || '300');
    
    if (this.isConfigured()) {
      this.initializeClient();
      this.startPolling();
    }
  }

  private isConfigured(): boolean {
    return !!(
      process.env.JIRA_URL &&
      process.env.JIRA_EMAIL &&
      process.env.JIRA_API_TOKEN
    );
  }

  private initializeClient(): void {
    if (!this.isConfigured()) {
      console.warn('JIRA configuration missing. JIRA integration disabled.');
      return;
    }

    this.client = new Version3Client({
      host: process.env.JIRA_URL!,
      authentication: {
        basic: {
          email: process.env.JIRA_EMAIL!,
          apiToken: process.env.JIRA_API_TOKEN!
        }
      }
    });

    console.log('JIRA client initialized successfully');
  }

  private async fetchInProgressTickets(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      const jql = 'status = "Development in progress" OR status = "Development in progress - ST" OR status = "Code review in progress"';
      
      const searchResults = await this.client.issueSearch.searchForIssuesUsingJql({
        jql,
        fields: ['key', 'summary', 'assignee', 'issuetype', 'customfield_10020', 'sprint'],
        maxResults: 100
      });

      const ticketsByEmail: Map<string, JiraTicket[]> = new Map();

      if (searchResults.issues) {
        for (const issue of searchResults.issues) {
          if (issue.fields?.assignee?.emailAddress) {
            
            // Try different ways to access issue type based on JIRA API variations
            let issueType = 'Unknown';
            
            if (issue.fields.issuetype) {
              if (typeof issue.fields.issuetype === 'string') {
                issueType = issue.fields.issuetype;
              } else if (issue.fields.issuetype.name) {
                issueType = issue.fields.issuetype.name;
              } else if ((issue.fields.issuetype as any).value) {
                issueType = (issue.fields.issuetype as any).value;
              }
            }

            // Extract sprint information
            let sprint = 'No Sprint';
            
            // Try different ways to access sprint field
            const sprintField = (issue.fields as any).customfield_10020 || (issue.fields as any).sprint;
            
            if (sprintField) {
              if (Array.isArray(sprintField) && sprintField.length > 0) {
                // Sprint is usually an array, get the latest active sprint
                const activeSprint = sprintField[sprintField.length - 1];
                if (activeSprint && activeSprint.name) {
                  sprint = activeSprint.name;
                } else if (typeof activeSprint === 'string') {
                  // Sometimes sprint is just a string
                  const sprintMatch = activeSprint.match(/name=([^,\]]+)/);
                  sprint = sprintMatch ? sprintMatch[1] : 'Unknown Sprint';
                }
              } else if (typeof sprintField === 'string') {
                sprint = sprintField;
              } else if (sprintField.name) {
                sprint = sprintField.name;
              }
            }

            const ticket: JiraTicket = {
              key: issue.key!,
              summary: issue.fields.summary || '',
              assigneeEmail: issue.fields.assignee.emailAddress,
              issueType: issueType,
              sprint: sprint
            };

            const userTickets = ticketsByEmail.get(ticket.assigneeEmail) || [];
            userTickets.push(ticket);
            ticketsByEmail.set(ticket.assigneeEmail, userTickets);
          }
        }
      }

      this.ticketCache = ticketsByEmail;
      console.log(`Updated JIRA ticket cache with ${searchResults.issues?.length || 0} tickets`);
    } catch (error) {
      console.error('Error fetching JIRA tickets:', error);
    }
  }

  private startPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    this.fetchInProgressTickets();

    this.pollInterval = setInterval(() => {
      this.fetchInProgressTickets();
    }, this.pollIntervalSeconds * 1000);

    console.log(`JIRA polling started with ${this.pollIntervalSeconds}s interval`);
  }

  public getTicketsForUser(email: string): JiraTicket[] {
    return this.ticketCache.get(email) || [];
  }

  public getJiraTicketUrl(ticketKey: string): string {
    return `${this.jiraUrl}/browse/${ticketKey}`;
  }

  public isEnabled(): boolean {
    return this.client !== null;
  }

  public stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log('JIRA polling stopped');
    }
  }
}

export const jiraService = new JiraService();

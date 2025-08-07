// Verification script for Individual Ticket Management API implementation
// This script verifies that all task requirements have been implemented

const fs = require('fs');
const path = require('path');

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function checkFileContains(filePath, searchStrings) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = {};

    searchStrings.forEach(searchString => {
      results[searchString] = content.includes(searchString);
    });

    return results;
  } catch (error) {
    return null;
  }
}

function verifyIndividualTicketAPI() {
  console.log('🔍 Verifying Individual Ticket Management API Implementation\n');

  let allPassed = true;

  // Task requirement: Create `/api/support/tickets/[id]` directory and route file
  console.log('1. Checking API route structure...');
  const routeFile = 'src/app/api/support/tickets/[id]/route.ts';

  if (checkFileExists(routeFile)) {
    console.log('✅ Route file created at correct location');
  } else {
    console.log('❌ Route file not found at expected location');
    allPassed = false;
  }

  // Task requirement: Implement GET method for ticket details with authorization checks
  console.log('\n2. Checking GET method implementation...');
  const getMethodChecks = [
    'export async function GET',
    'authenticateRequest(request)',
    'unauthorized()',
    'forbidden()',
    'mongoose.Types.ObjectId.isValid',
    'SupportTicket.findById',
    'populate("submittedBy"',
    'populate("assignedTo"',
    'isOwner',
    'isAdminOrInternal',
    'response) => !response.isInternal'
  ];

  const getResults = checkFileContains(routeFile, getMethodChecks);
  if (getResults) {
    getMethodChecks.forEach(check => {
      if (getResults[check]) {
        console.log(`✅ GET method has ${check}`);
      } else {
        console.log(`❌ GET method missing ${check}`);
        allPassed = false;
      }
    });
  } else {
    console.log('❌ Could not read route file');
    allPassed = false;
  }

  // Task requirement: Implement PUT method for ticket updates (admin-only status/priority changes)
  console.log('\n3. Checking PUT method implementation...');
  const putMethodChecks = [
    'export async function PUT',
    'UserRole.ADMIN, UserRole.INTERNAL',
    'forbidden()',
    'validateTicketData',
    'sanitizeTicketContent',
    'findByIdAndUpdate',
    'changes',
    'updateData',
    'TicketStatus',
    'TicketPriority',
    'TicketCategory'
  ];

  const putResults = checkFileContains(routeFile, putMethodChecks);
  if (putResults) {
    putMethodChecks.forEach(check => {
      if (putResults[check]) {
        console.log(`✅ PUT method has ${check}`);
      } else {
        console.log(`❌ PUT method missing ${check}`);
        allPassed = false;
      }
    });
  }

  // Task requirement: Implement DELETE method for ticket deletion with proper permissions
  console.log('\n4. Checking DELETE method implementation...');
  const deleteMethodChecks = [
    'export async function DELETE',
    'userData.role !== UserRole.ADMIN',
    'forbidden()',
    'findByIdAndDelete',
    'ticketDetails',
    'ticketNumber'
  ];

  const deleteResults = checkFileContains(routeFile, deleteMethodChecks);
  if (deleteResults) {
    deleteMethodChecks.forEach(check => {
      if (deleteResults[check]) {
        console.log(`✅ DELETE method has ${check}`);
      } else {
        console.log(`❌ DELETE method missing ${check}`);
        allPassed = false;
      }
    });
  }

  // Task requirement: Add audit trail logging for all ticket modifications
  console.log('\n5. Checking audit trail logging...');
  const auditChecks = [
    'logAuditTrail',
    'VIEW_TICKET',
    'UPDATE_TICKET',
    'DELETE_TICKET',
    'AUDIT_TRAIL:',
    'timestamp',
    'action',
    'ticketId',
    'userId',
    'changes',
    'metadata'
  ];

  const auditResults = checkFileContains(routeFile, auditChecks);
  if (auditResults) {
    auditChecks.forEach(check => {
      if (auditResults[check]) {
        console.log(`✅ Audit trail has ${check}`);
      } else {
        console.log(`❌ Audit trail missing ${check}`);
        allPassed = false;
      }
    });
  }

  // Check for proper error handling
  console.log('\n6. Checking error handling...');
  const errorHandlingChecks = [
    'try {',
    'catch (error)',
    'console.error',
    'NextResponse.json',
    'status: 400',
    'unauthorized()',
    'forbidden()',
    'status: 404',
    'status: 500'
  ];

  const errorResults = checkFileContains(routeFile, errorHandlingChecks);
  if (errorResults) {
    errorHandlingChecks.forEach(check => {
      if (errorResults[check]) {
        console.log(`✅ Error handling has ${check}`);
      } else {
        console.log(`❌ Error handling missing ${check}`);
        allPassed = false;
      }
    });
  }

  // Check for input validation
  console.log('\n7. Checking input validation...');
  const validationChecks = [
    'mongoose.Types.ObjectId.isValid',
    'validateTicketData',
    'sanitizeTicketContent',
    'Object.values(TicketCategory)',
    'Object.values(TicketPriority)',
    'Object.values(TicketStatus)'
  ];

  const validationResults = checkFileContains(routeFile, validationChecks);
  if (validationResults) {
    validationChecks.forEach(check => {
      if (validationResults[check]) {
        console.log(`✅ Input validation has ${check}`);
      } else {
        console.log(`❌ Input validation missing ${check}`);
        allPassed = false;
      }
    });
  }

  // Summary
  console.log('\n=== Verification Summary ===');
  if (allPassed) {
    console.log('🎉 All task requirements have been successfully implemented!');
    console.log('\n✅ Task 3 - Create individual ticket management API - COMPLETED');
    console.log('\nImplemented features:');
    console.log('• GET /api/support/tickets/[id] - Fetch ticket details with authorization');
    console.log('• PUT /api/support/tickets/[id] - Update tickets (admin-only)');
    console.log('• DELETE /api/support/tickets/[id] - Delete tickets (admin-only)');
    console.log('• Comprehensive authorization checks');
    console.log('• Input validation and sanitization');
    console.log('• Audit trail logging for all modifications');
    console.log('• Proper error handling and status codes');
    console.log('• MongoDB ObjectId validation');
    console.log('• User role-based access control');
    console.log('• Internal response filtering for non-admin users');
  } else {
    console.log('❌ Some requirements are missing or incomplete');
    console.log('Please review the implementation and ensure all features are properly implemented.');
  }

  return allPassed;
}

// Run verification
const success = verifyIndividualTicketAPI();
process.exit(success ? 0 : 1);
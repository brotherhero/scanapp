
/*
 * EmailHelper.js 
 * Copyright (C) Xerox Corporation, 2012.  All rights reserved. 
 *
 * This file contains functions to start a scan job and to handle the response
 * using the ScanV2 Job Web Service Library
 */

/****************************  GLOBALS  *******************************/

var XRX_SCANV2_JOB_TICKET_NAMESPACE = 'xmlns:xsi=&quot;http://www.w3.org/2001/XMLSchema-instance&quot;' +
                                    ' xmlns:xsd=&quot;http://www.w3.org/2001/XMLSchema&quot;' +
                                    ' xmlns=&quot;http://schemas.xerox.com/enterprise/eipjobmodel/1&quot;';


var jobId = '';

var userId = null;
var acctId = null;
var acctType = null;


/****************************  FUNCTIONS  *******************************/
            
/**
* This function initiates a scanv2 job
*/
function start() 
{
    var to = document.getElementById('to').value;
    var cc = document.getElementById('cc').value;
    var bcc = document.getElementById('bcc').value;
    var from = document.getElementById('from').value;
    var replyTo = (document.getElementById('replyTo').value != '') ? document.getElementById('replyTo').value : from;
    var subjectLine = document.getElementById('subject').value;
    var messageBody = document.getElementById('messageBody').value;
   
    var emailOptionsTag = xrxScanV2JobTicketEmailOptions(to, cc, bcc, from, replyTo, subjectLine, messageBody, '', '', '');    
    var manualValueTag = xrxScanV2JobTicketManualValue('', '', '', '', '', '', '', '', '', '', emailOptionsTag);
    var destinationTag = xrxScanV2JobTicketDestination('SMTP', manualValueTag);
  
    var accountingTag = xrxScanV2JobTicketAccounting(userId, acctId, acctType);

    var colorVal = document.getElementById('Color').value;
    var sidesVal = document.getElementById('Sides').value;
    var originalSizeVal = document.getElementById('OriginalSize').value;
	var resolutionVal = document.getElementById('Resolution').value;
	var imageOptionsTag = xrxCreateEscapedTag('ImageOptions', '', xrxCreateEscapedTag('Resolution', '', resolutionVal));

    var layoutAdjustmentTag = xrxScanV2JobTicketLayoutAdjustment('', originalSizeVal, '');
    var inputTag = xrxScanV2JobTicketInput(colorVal, sidesVal, '', imageOptionsTag, layoutAdjustmentTag, '', accountingTag);
    var outputTag = xrxScanV2JobTicketOutput(destinationTag, '');
    var jobProcessingTag = xrxScanV2JobTicketJobProcessing(inputTag, outputTag);
    var jobDescriptionTag = xrxScanV2JobTicketJobDescription('test');

    var jobTicketPayload = xrxScanV2JobTicketPayload('', '', jobProcessingTag);
    var jobTicket = xrxScanV2JobTicket(jobTicketPayload);

    xrxScanV2InitiateScanJob("http://127.0.0.1", jobTicket, callback_success_scan_job, callback_failure_scan_job);
}

/**
* This function handles the response when InitiateScanJob (ScanV2) is successful. 
*
* @param    request         InitiateScanJob soap request
* @param	response		InitiateScanJob soap response
*/
function callback_success_scan_job(request, response) 
{
	document.getElementById("ScanAnimation").style.display = "block";
    
    jobId = xrxScanV2ParseInitiateScanJob( response );
        
    xrxGetJobDetails("http://127.0.0.1", "Email", "JobId", jobId, callback_success_job_details, callback_failure_job_details);
}

/**
* This function handles the response when InitiateScanJob (ScanV2) fails. 
*
* @param    request         InitiateScanJob soap request
* @param	response		InitiateScanJob soap response
*/
function callback_failure_scan_job(request, response) 
{
    alert("InitiateScanJob failed : " + response);
}

/**
* This function handles the response when GetJobDetails is successful. 
*
* @param    request         GetJobDetails soap request
* @param	response		GetJobDetails soap response
*/              
function callback_success_job_details(request, response)
{
    var jobDetails = xrxJobMgmtParseGetJobDetails(response);
    var jobStateNode = xrxFindElement(jobDetails, ["JobInfo", "JobState"]);
    var jobState = xrxGetValue(jobStateNode);

    var jobStateMsg = jobId + " : " + jobState;
    writeSR3(jobStateMsg, false);
    
    if (jobState == 'Completed')
    {
        var jobStateReason = xrxJobMgmtParseJobStateReasons(response);
        var jobStateReasonMsg =  " - " + jobStateReason;
        writeSR3(jobStateReasonMsg, true);
		document.getElementById("ScanAnimation").style.display = "none";
        
        setTimeout("writeSR3('', false)", 10000);
    }
    else
    {
        setTimeout("xrxGetJobDetails(\"http://127.0.0.1\", \"Email\", \"JobId\", jobId, callback_success_job_details, callback_failure_job_details)", 5000);
    }
}
  
/**
* This function handles the response when GetJobDetails fails. 
*
* @param    request         GetJobDetails soap request
* @param	response		GetJobDetails soap response
*/      
function callback_failure_job_details(request, response)
{
	document.getDocumentById("ScanAnimation").style.display = "none";
    
    alert("GetJobDetails failed : " + response);
}

// InitiateScanJob job ticket help functions

/**
* This function builds the InitiateScanJob job ticket
*
* @param    jobTicketPayload    job ticket payload in string form
* @return   string              job ticket in string form
*/
function xrxScanV2JobTicket(scanV2JobTicketPayload) {
    return xrxCreateTag('ScanJobTicketXmlDocument', '', 
                '&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;' + scanV2JobTicketPayload);
}

/**
* This function builds the InitiateScanJob job ticket payload
* 
* @param    schemaVersionTag   schemaVersion tag in string form
* @param    jobDescriptionTag  JobDescription tag in string form
* @param    jobProcessingTag   JobProcessing tag in string from
* @return   string             job ticket payload in string from
*/
function xrxScanV2JobTicketPayload(schemaVersionTag, jobDescriptionTag, jobProcessingTag) 
{
    return xrxCreateEscapedTag('ScanJobTicket', XRX_SCANV2_JOB_TICKET_NAMESPACE,
        schemaVersionTag + jobDescriptionTag + jobProcessingTag);
}

/**
* This function builds the InitiateScanJob schemaVersion tag
* 
* @param    majorVersion    major version
* @param    minorVersion    minor version
* @param    revision        revision
* @return   string          schemaVersion tag
*/
function xrxScanV2JobTicketSchemaVersion(majorVersion, minorVersion, revision) 
{
    var majorVersionTag = xrxCreateEscapedTag('MajorVersion', '', majorVersion);
    var minorVersionTag = xrxCreateEscapedTag('MinorVersion', '', mainorVersion);
    var revisionTag = xrxCreateEscapedTag('Revision', '', revision);

    return xrxCreateEscapedTag('schemaVersion', '', majorVersionTag + minorVersionTag + revisionTag);
}

/**
* This function builds the InitiateScanJob JobDescription tag
* 
* @param    jobName         job name
* @return   string          JobDescription in string form
*/
function xrxScanV2JobTicketJobDescription(jobName) 
{
    return xrxCreateEscapedTag('JobDescription', '', xrxCreateEscapedTag('JobName', '', jobName));
}

/**
* This function builds the InitiateScanJob JobProcessing tag
* 
* @param    inputTag        input tag in string form
* @param    outputTag       output tag in string form
* @return   string          JobProcessing in string form
*/
function xrxScanV2JobTicketJobProcessing(inputTag, outputTag) 
{
    return xrxCreateEscapedTag('JobProcessing', '', inputTag + outputTag);
}

/**
* This function builds the InitiateScanJob JobProcessing Input tag
* 
* @param    colorMode           color mode value
* @param    sides               sides value
* @param    originalTypeTag     OriginalType tag
* @param    imageOptionsTag     ImageOptions tag
* @param    layoutAdjustmentTag LayoutAdjustment tag
* @param    imageSettingsTag    ImageSettings tag
* @param    accountingTag       Accounting tag
* @return   string              Input tag in string form
*/
function xrxScanV2JobTicketInput(colorMode, sides, originalTypeTag, imageOptionsTag, layoutAdjustmentTag, imageSettingsTag, accountingTag) 
{
    return xrxCreateEscapedTag('Input', '', xrxCreateEscapedTag('ColorMode', '', colorMode) +
            xrxCreateEscapedTag('Sides', '', sides) + originalTypeTag + imageOptionsTag + layoutAdjustmentTag + imageSettingsTag + accountingTag);
}

/**
* This function builds the InitiateScanJob LayoutAdjustment tag
* 
* @param    inputOrientation    input orientation
* @param    inputMediaSize      input media size
* @param    inputEdgeEraseTag   edge erase tag
* @return   string              LayoutAdjustment tag in string form
*/
function xrxScanV2JobTicketLayoutAdjustment(inputOrientation, inputMediaSize, inputEdgeEraseTag) 
{
    return xrxCreateEscapedTag('LayoutAdjustment', '', xrxCreateEscapedTag('InputOrientation', '', inputOrientation) +
                                                xrxCreateEscapedTag('InputMediaSize', '', xrxCreateEscapedTag('MediaSizeType', '', inputMediaSize)) +
                                                xrxCreateEscapedTag('InputEdgeErase', '', inputEdgeEraseTag));
}


/**
* This function builds the InitiateScanJob Accounting tag
* 
* @param    userId              user id
* @param    acctId              account id
* @param    acctType            account type
* @return   string              Accounting tag in string form
*/
function xrxScanV2JobTicketAccounting(userId, acctId, acctType) 
{
    if ((acctType != undefined) && (acctType != null)) {
        return xrxCreateEscapedTag('Xsa', '', xrxCreateEscapedTag('AccountUserId', '', userId) +
                                        xrxCreateEscapedTag('AccountTypeInfo', '', xrxCreateEscapedTag('AccountType', '', acctType) + xrxCreateEscapedTag('AccountID', '', acctId)));
    }
    else {
        return xrxCreateEscapedTag('Jba', '', xrxCreateEscapedTag('JobAccountingUserId', '', userId) + xrxCreateEscapedTag('JobAccountId', '', acctId));
    }
}

/**
* This function builds the InitiateScanJob JobProcessing Output tag
* 
* @param    destinationTag      Destination tag
* @param    metaDataTag         MetaData tag
* @return   string              Output tag in string form
*/
function xrxScanV2JobTicketOutput(destinationTag, metaDataTag) 
{
    return xrxCreateEscapedTag('Output', '', destinationTag + metaDataTag);
}

/**
* This function builds the InitiateScanJob Destination tag
* 
* @param    destinationType     DestinationType value
* @param    manualValueTag      ManualValue tag
* @return   string              Destination tag in string form
*/
function xrxScanV2JobTicketDestination(destinationType, manualValueTag) 
{
    if (destinationType == '') {
        alert("Please specify the file destination.");
    }

    return xrxCreateEscapedTag('Destination', '', xrxCreateEscapedTag('DestinationType', '', destinationType) + manualValueTag);
}

/**
* This function builds the InitiateScanJob ManualValue tag
* 
* @param    friendlyName        FriendlyName value
* @param    loginSourceTag         LoginSource tag
* @param    filingPolicy        FilingPolicy value
* @param    host                Host value
* @param    path                Path value
* @param    share               Share value
* @param    validateCertificate ValidateCertificate value
* @param    phoneNumber         PhoneNumber value
* @param    scriptPath          ScriptPath value
* @param    documentFormat      DocumentFormat value
* @param    emailOptionsTag     EmailOptions tag
* @return   string              ManualValue tag in string form
*/
function xrxScanV2JobTicketManualValue(friendlyName, loginSourceTag, filingPolicy, host, path, share, validateCertificate, phoneNumber, scriptPath, documentFormat, emailOptionsTag) 
{
    var friendlyNameTag = (friendlyName != '') ? xrxCreateEscapedTag('FriendlyName', '', frientlyName) : '';
    var filingPolicyTag = (filingPolicy != '') ? xrxCreateEscapedTag('FilingPolicy', '', filingPolicy) : '';
    var hostTag = (host != '') ? xrxCreateEscapedTag('Host', '', host) : '';
    var pathTag = (path != '') ? xrxCreateEscapedTag('Path', '', path) : '';
    var shareTag = (share != '') ? xrxCreateEscapedTag('Share', '', share) : '';
    var validateCertificateTag = (validateCertificate != '') ? xrxCreateEscapedTag('ValidateCertificate', '', validateCertificate) : '';
    var phoneNumberTag = (phoneNumber != '') ? xrxCreateEscapedTag('PhoneNumber', '', phoneNumber) : '';
    var scriptPathTag = (scriptPath != '') ? xrxCreateEscapedTag('ScriptPath', '', scriptPath) : '';
    var documentFormatTag = (documentFormat != '') ? xrxCreateEscapedTag('DocumentFormat', '', documentFormat) : '';

    return xrxCreateEscapedTag('ManualValue', '', friendlyNameTag + loginSourceTag + filingPolicyTag + hostTag + pathTag +
                shareTag + validateCertificateTag + phoneNumberTag + scriptPathTag + documentFormatTag + emailOptionsTag);
}

/**
* This function builds the InitiateScanJob EmailOptions tag
* 
* @param    to                  To value
* @param    cc                  Cc value
* @param    bcc                 Bcc value
* @param    from                From tag
* @param    replyTo             ReplyTo value
* @param    subjectLine         SubjectLine value
* @param    messageBody         MessageBody value
* @param    attachmentName      AttachmentName value
* @param    smtpAcctUserid      SMTPAccountUserId value
* @param    smtpAcctId          SMTPAccountId value
* @return   string              EmailOptions tag in string form
*/
function xrxScanV2JobTicketEmailOptions(to, cc, bcc, from, replyTo, subjectLine, messageBody, attachmentName, smtpAcctUserId, smtpAcctId) 
{
    if (to == '') 
    {
        alert("Please enter at least one to address.");
    }

    if (from == '') 
    {
        alert("Please enter the from address.");
    }

    var toTag = xrxCreateEscapedTag('To', '', to);
    var ccTag = xrxCreateEscapedTag('Cc', '', cc);
    var bccTag = xrxCreateEscapedTag('Bcc', '', bcc);
    var recipientsTag = xrxCreateEscapedTag('Recipients', '', toTag + ccTag + bccTag);
    var fromTag = xrxCreateEscapedTag('From', '', from);
    var replyToTag = (replyTo != '') ? xrxCreateEscapedTag('ReplyTo', '', replyTo) : fromTag;
    var subjectLineTag = (subjectLine != '') ? xrxCreateEscapedTag('SubjectLine', '', subjectLine) : '';
    var messageBodyTag = (messageBody != '') ? xrxCreateEscapedTag('MessageBody', '', messageBody) : '';
    var attachmentNameTag = (attachmentName != '') ? xrxCreateEscapedTag('AttachmentName', '', attachmentName) : '';
    var smtpAcctUserIdTag = (smtpAcctUserId != '') ? xrxCreateEscapedTag('SMTPAccountUserId', '', smtpAcctUserId) : '';
    var smtpAcctIdTag = (smtpAcctId != '') ? xrxCreateEscapedTag('SMTPAccountId', '', smtpAcctId) : '';
    return xrxCreateEscapedTag('EmailOptions', '', recipientsTag + fromTag + replyToTag + subjectLineTag + messageBodyTag + attachmentNameTag +
                smtpAcctUserIdTag + smtpAcctIdTag);
}

/*
* Get Session Info
*/
function getSessionInfo() 
{
    xrxSessionGetSessionInfo("http://127.0.0.1", callback_success_get_session, callback_failure_get_session);
}

/**
* This function handles the response when the GetSessionInfo call is successful
*
* @param request	soap request for the GetSessionInfo call
* @param response	soap response for the GetSessionInfo call
*/
function callback_success_get_session(request, response) 
{
    disable('Next', false);

    var data = xrxSessionParseGetSessionInfo(response);
    var jba = xrxGetElementValue(data, "jba");
    var xsa = xrxGetElementValue(data, "xsa");

    if (jba != null) {
        var jbaUserId = xrxGetElementValue(data, "userID");
        var jbaAcctId = xrxGetElementValue(data, "accountID");

        userId = jbaUserId;
        acctId = jbaAcctId;
        acctType = null;

        var jbaMsg = "User ID : " + userId + "   Account ID : " + acctId;
        writeSR2(jbaMsg, false);
    }

    if (xsa != null) {
        var xsaUserId = xrxGetElementValue(data, "userID");
        var xsaAcctType = xrxGetElementValue(data, "AccountType");
        var xsaAcctId = xrxGetElementValue(data, "AccountID");

        userId = xsaUserId;
        acctId = xsaAcctId;
        acctType = xsaAcctType;

        var xsaMsg = "User ID : " + userId + "   Account ID : " + acctId + "   Account Type : " + acctType;
        writeSR2(xsaMsg, false);
    }
}

/**
* This function handles the response when the GetSessionInfo call fails
*
* @param request	soap request for the GetSessionInfo call
* @param response	soap response for the GetSessionInfo call
*/
function callback_failure_get_session(envelope, response) 
{
    alert("GetSessionInfo failed : " + response);
}

/**
* This function creates an xml tag in an escaped string.
*
* @param	label		tag
* @param	type		attribute
* @param	value		text value
*/
function xrxCreateEscapedTag(label, type, value) 
{
    if (type == "") {
        return ("&lt;" + label + "&gt;" + value + "&lt;/" + label + "&gt;");
    }
    else {
        return ("&lt;" + label + " " + type + "&gt;" + value + "&lt;/" + label + "&gt;");
    }
}

/*************************  End of File  *****************************/
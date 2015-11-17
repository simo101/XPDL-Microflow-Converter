/// <reference path='./typings/tsd.d.ts' />

import { MendixSdkClient, OnlineWorkingCopy, Project, Revision, Branch } from "mendixplatformsdk";
import { ModelSdkClient, IModel, projects, domainmodels, microflows, pages, navigation, texts } from "mendixmodelsdk";

import when = require('when');
import fs = require('fs'); 


//const readlineSync = require('readline-sync');

/*
 * CREDENTIALS
 */

const username = "{Your Email}";
const apikey = "{Your API Key}";
const projectId = "{Your project ID}";
const projectName = "XPDL SDK Converter";
const revNo = -1; // -1 for latest
const branchName = null // null for mainline
var activityid = 1000;
var XMLString = `<?xml version="1.0"?><Package Name="${projectName}" Id="${projectId}" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:fn="http://www.w3.org/2004/07/xpath-functions" xmlns:xdt="http://www.w3.org/2004/07/xpath-datatypes" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/" xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:tns="http://schemas.xmlsoap.org/tns/" xmlns="http://www.wfmc.org/2004/XPDL2.0alpha" xmlns:cordys="http://schemas.cordys.com/bpm"><PackageHeader><XPDLVersion>2.0</XPDLVersion><Vendor>Mendix</Vendor><Created/><Description>${projectName}</Description></PackageHeader><Pools/>`

const client = new MendixSdkClient(username, apikey);

// const xml = builder.create('Packages');

/*
 * PROJECT TO ANALYZE
 */
const project = new Project(client, projectId, projectName);

client.platform().createOnlineWorkingCopy(project, new Revision(revNo, new Branch(project, branchName)))
    .then(workingCopy => workingCopy.model().allMicroflows().filter(mf => mf.qualifiedName.indexOf('MyFirstModule') >= 0))
    .then(microflows => loadAllMicroflows(microflows))
    .then(microflows => microflows.forEach(microflowToText))
    .then(microflows => createXMLDocument())
    .done(
        () => {
            console.log("Done.");
            
        },
        error => {
            console.log("Something went wrong:");
            console.dir(error);
        });

function loadAllMicroflows(microflows: microflows.IMicroflow[]): when.Promise<microflows.Microflow[]> {
    return when.all<microflows.Microflow[]>(microflows.map(loadMicroflow));
}

function loadMicroflow(microflow: microflows.IMicroflow): when.Promise<microflows.Microflow> {
    return when.promise<microflows.Microflow>((resolve, reject) => {
        if (microflow) {
            console.log(`Loading microflow: ${microflow.qualifiedName}`);
            microflow.load(mf => {
                if (mf) {
                    console.log(`Loaded microflow: ${microflow.qualifiedName}`);
                    resolve(mf);
                } else {
                    console.log(`Failed to load microflow: ${microflow.qualifiedName}`);
                    reject(`Failed to load microflow: ${microflow.qualifiedName}`);
                }
            });
        } else {
            reject(`'microflow' is undefined`);
        }
    });
}

function getLineRepresentationOfAction(action: microflows.MicroflowAction) {
    if (action instanceof microflows.AggregateListAction) {
        return addActivity(action.container);
   } else if (action instanceof microflows.AppServiceCallAction) {
       return addActivity(action.container);
    } else if (action instanceof microflows.WebServiceCallAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.CastAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.ChangeObjectAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.ChangeListAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.ChangeVariableAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.CloseFormAction) {
       return addActivity(action.container);
    } else if (action instanceof microflows.CommitAction) {
       return addActivity(action.container);
    } else if (action instanceof microflows.DeprecatedCreateAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.CreateObjectAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.CreateListAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.CreateVariableAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.DeleteAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.DownloadFileAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.ExportXmlAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.GenerateDocumentAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.ImportXmlAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.JavaActionCallAction) {
        return addActivity(action.container);    } 
    else if (action instanceof microflows.ListOperationAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.LogMessageAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.MicroflowCallAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.RetrieveAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.RollbackAction) {
       return addActivity(action.container);
    } else if (action instanceof microflows.ShowHomePageAction) {
       return addActivity(action.container);
    } else if (action instanceof microflows.ShowMessageAction) {
        return addActivity(action.container);
    } else if (action instanceof microflows.ShowPageAction) {
       return addActivity(action.container);
    } else if (action instanceof microflows.ValidationFeedbackAction) {
        return addActivity(action.container);
    } else {
        throw 'not recognized action type: ' + action.typeName;
    }
}

function getLineRepresentation(microflowObject: microflows.MicroflowObject) {
    if (microflowObject instanceof microflows.StartEvent) {
        return addStartEvent(microflowObject);
    } else if (microflowObject instanceof microflows.ActionActivity) {
        var actionActivity = <microflows.ActionActivity>microflowObject;
        return getLineRepresentationOfAction(actionActivity.action);
    } else if (microflowObject instanceof microflows.Annotation) {
        var annotation = <microflows.Annotation> microflowObject;
        return '#  ' + annotation.caption;
    } else if (microflowObject instanceof microflows.BreakEvent) {
        return "BREAK";
    } else if (microflowObject instanceof microflows.ContinueEvent) {
        return "CONTINUE";
    } else if (microflowObject instanceof microflows.EndEvent) {
        return addEndEvent(microflowObject);
    } else if (microflowObject instanceof microflows.ErrorEvent) {
        return "raise error";
    } else if (microflowObject instanceof microflows.ExclusiveMerge) {
        return null;
    } else if (microflowObject instanceof microflows.MicroflowParameterObject) {
        if (microflowObject.type[0] == '#')
            return addDataEvent(microflowObject.type.substring(1), microflowObject.name);
        else
            return addDataEvent(microflowObject.type, microflowObject.name);
        
    }
   
      else if (microflowObject instanceof microflows.ExclusiveSplit) {
        throw 'not supposed to be handled here, syntax thing';
    } else if (microflowObject instanceof microflows.InheritanceSplit) {
        throw 'not supposed to be handled here, syntax thing';
    } else if (microflowObject instanceof microflows.LoopedActivity) {
        throw 'not supposed to be handled here, syntax thing';
    } else {
        throw "unknown element: " + microflowObject.typeName;
    }
}


function logIndent(indent: number, message: string) {
    console.log(Array(indent + 1).join(' ') + message);
}
function logXML(xml: string) {
    XMLString = XMLString + xml;
}

function createXMLDocument(){

        fs.writeFileSync('MendixMode.xpdl', XMLString); 

}

function addStartEvent(mfObject:microflows.MicroflowObject): string{
        
        return '<Activity Id="'+mfObject.id+'" Name="Start">'+
          '<Event>'+
            '<StartEvent/>'+
          '</Event>'+
          '<NodeGraphicsInfos>'+
            `<NodeGraphicsInfo BorderColor="0,0,128" FillColor="255,219,74" Height="${mfObject.size.height}" Width="${mfObject.size.width}">`+
              `<Coordinates XCoordinate="${mfObject.relativeMiddlePoint.x}" YCoordinate="${mfObject.relativeMiddlePoint.y}"/>`+
            '</NodeGraphicsInfo>'+
          '</NodeGraphicsInfos>'+
        '</Activity>';
    
}

function addXOREvent(mfObject:microflows.ExclusiveSplit, trueHandler:microflows.SequenceFlow, falseHandler:microflows.SequenceFlow): string{
   
    var transitionRefString= '';
    transitionRefString = transitionRefString+                            
                        `<TransitionRef Id="${trueHandler.id}" />`;
    transitionRefString = transitionRefString+                            
                        `<TransitionRef Id="${falseHandler.id}" />`;
        var conditionCaption = '';
        var condition = mfObject.splitCondition;
    if (condition instanceof microflows.ExpressionSplitCondition) {
                    conditionCaption = (<microflows.ExpressionSplitCondition>condition).expression;
    } else if (condition instanceof microflows.RuleSplitCondition) {
           var c = <microflows.RuleSplitCondition>condition;
          conditionCaption = c.ruleCall.ruleQualifiedName + '(' + c.ruleCall.parameterMappings.map(x => x.parameterQualifiedName.split('.').splice(2, 1) + '=' + x.argument).join(', ') + ')';
    }
    
    return `<Activity Id="${mfObject.id}" Name="${mfObject.caption}">`+
          '<Route GatewayType="XOR"/>'+
          '<TransitionRestrictions>'+
                  '<TransitionRestriction>'+
                     '<Split Type="XOR">'+
                        '<TransitionRefs>'+
                           transitionRefString+
                        '</TransitionRefs>'+
                        '<OutgoingCondition>'+
                            condition+
                         '</OutgoingCondition>'+
                     '</Split>'+
                  '</TransitionRestriction>'+
               '</TransitionRestrictions>'+
          '<NodeGraphicsInfos>'+
  `<NodeGraphicsInfo BorderColor="0,0,128" FillColor="255,219,74" Height="${mfObject.size.height}"  Width="${mfObject.size.width}">`+
              `<Coordinates XCoordinate="${mfObject.relativeMiddlePoint.x}" YCoordinate="${mfObject.relativeMiddlePoint.y}"/>`+
            '</NodeGraphicsInfo>'+
          '</NodeGraphicsInfos>'+
        '</Activity>';
    
}

function addActivity(mfAction:microflows.ActionActivity): string{
         
        return '<Activity Id="'+mfAction.id+'" Name="'+mfAction.caption+'">'+
               '<Implementation>'+
                  '<Task>'+
                     '<TaskApplication Id="'+mfAction.id+'" Name="'+mfAction.caption+'" />'+
                  '</Task>'+
               '</Implementation>'+
               '<NodeGraphicsInfos>'+
                  `<NodeGraphicsInfo Height="${mfAction.size.height}"  Width="${mfAction.size.width}">`+
                     '<Coordinates XCoordinate="'+mfAction.relativeMiddlePoint.x+'" YCoordinate="'+mfAction.relativeMiddlePoint.y+'" />'+
                  '</NodeGraphicsInfo>'+
               '</NodeGraphicsInfos>'+  
            '</Activity>';
}

function addEndEvent(mfObject:microflows.MicroflowObject): string{
    
          return '<Activity Id="'+mfObject.id+'" Name="End">'+
          '<Event>'+
           '<EndEvent/>'+
          '</Event>'+
          '<NodeGraphicsInfos>'+
  `<NodeGraphicsInfo BorderColor="0,0,128" FillColor="255,219,74" Height="${mfObject.size.height}" Width="${mfObject.size.width}">`+
              `<Coordinates XCoordinate="${mfObject.relativeMiddlePoint.x}" YCoordinate="${mfObject.relativeMiddlePoint.y}"/>`+
            '</NodeGraphicsInfo>'+
          '</NodeGraphicsInfos>'+
        '</Activity>';
    
}
function addDataEvent(datatype:string,name:string): string{
     activityid = activityid + 1;
          return '<DataField Id="'+activityid+'" Name="'+name+'">'+
          '<DataType>'+
            '<BasicType Type="'+datatype+'">'+
              '<Precision>10</Precision>'+
            '</BasicType>'+
          '</DataType>'+
        '</DataField>';
    
}

function closeXML(): string{
    
          return '</WorkflowProcess></WorkflowProcesses></Package>';
    
}
function createTransitionFlow(sequenceFlow:microflows.SequenceFlow):string{
    var caseValue = sequenceFlow.caseValue;
    if(caseValue instanceof microflows.EnumerationCase){
        return `<Transition From="${sequenceFlow.origin.id}" To="${sequenceFlow.destination.id}" Id="${sequenceFlow.id}" Name="${caseValue.value}" />`;
    }else if (caseValue instanceof microflows.InheritanceCase){
          return `<Transition From="${sequenceFlow.origin.id}" To="${sequenceFlow.destination.id}" Id="${sequenceFlow.id}" Name="${caseValue.value}" />`;
    }
    else{
         return `<Transition From="${sequenceFlow.origin.id}" To="${sequenceFlow.destination.id}" Id="${sequenceFlow.id}" Name="" />`;
    }    
}
function createAnnotationFlow(annotationFlow:microflows.AnnotationFlow):string{
    
    return '<Transition From="'+annotationFlow.origin.id+'" To="'+annotationFlow.destination.id+'" Id="'+annotationFlow.id+'" Name="'+annotationFlow.container.name+'" />';
}


function microflowToText(microflow: microflows.Microflow) {
   logXML(`<WorkflowProcesses><WorkflowProcess Name="${microflow.name}" Id="${microflow.qualifiedName}" AccessLevel="PRIVATE"><ProcessHeader><Created>1190983582985</Created><Description>Example 1</Description><Priority>3</Priority>`+
`</ProcessHeader><RedefinableHeader><Author>demouser</Author><Version>vcmdemo10</Version>`+
`</RedefinableHeader><Participants><Participant Id="currentOwner"><ParticipantType Type="ROLE"/></Participant></Participants>`);

      logXML('<DataFields>');
    microflow.objectCollection.objects.filter(o => o instanceof microflows.MicroflowParameterObject).forEach((o) => {
       logXML(getLineRepresentation(o));
    });
        logXML('</DataFields>');
        logXML('<Activities>');
    var startEvent: microflows.StartEvent = microflow.objectCollection.objects.filter(o => o instanceof microflows.StartEvent)[0];
  
    var annotations: { [originid: string]: microflows.AnnotationFlow[] } = {};
    var flows: { [originid: string]: microflows.SequenceFlow[] } = {};
    var flowsReversed: { [originid: string]: microflows.SequenceFlow[] } = {};

    microflow.flows.forEach(f => {
        if (f instanceof microflows.SequenceFlow) {
            if (!(f.destination.id in flowsReversed))
                flowsReversed[f.destination.id] = [];
            flowsReversed[f.destination.id].push(f);
            if (!(f.origin.id in flows))
                flows[f.origin.id] = [];
            flows[f.origin.id].push(f);
           
        } else if (f instanceof microflows.AnnotationFlow) {
            if (!(f.destination.id in annotations)) {
                annotations[f.destination.id] = [];
            }
            annotations[f.destination.id].push(f);
            if (!(f.origin.id in annotations)) {
                annotations[f.origin.id] = [];
            }
            annotations[f.origin.id].push(f);
        }
    });

    var visited = {};

    function startWalkingBoots(currentEvent: microflows.MicroflowObject, indent: number, breakOnMerges = true): microflows.ExclusiveMerge[] {
        if (currentEvent instanceof microflows.ExclusiveMerge && breakOnMerges && flowsReversed[currentEvent.id].length > 1) {
            return [currentEvent];
        }
        if (currentEvent.id in visited) {
            console.log('WARNING, BEEN HERE BEFORE ' + currentEvent.typeName);
        }
        visited[currentEvent.id] = true;

        if (currentEvent.id in annotations) {
            annotations[currentEvent.id].forEach((annotation) => {
                if (currentEvent == annotation.destination)
                    logXML(getLineRepresentation(annotation.origin));
                else
                    logXML(getLineRepresentation(annotation.destination));
            });
        }

        function displayBlock(currentEvent: microflows.MicroflowObject, indent: number) {
            if (currentEvent instanceof microflows.LoopedActivity) {
                //logIndent(indent, 'for (' + currentEvent.loopVariableName + ' in ' + currentEvent.iteratedListVariableName + ') {');
                var loop = (<microflows.LoopedActivity>currentEvent);
                var nextItems = loop.objectCollection.objects.filter(x => !(x.id in flowsReversed || x instanceof microflows.Annotation));

                if (nextItems.length != 1) {
                    throw "Loop in microflow " + microflow.qualifiedName + " has more than one entry point";
                }
                var unfinishedMerges = startWalkingBoots(nextItems[0], indent + 2);
                if (unfinishedMerges.length > 0) {
                    throw 'nested microflow has unfinishedMerges';
                }
               // logIndent(indent, '}');
            } else {
                var msg = getLineRepresentation(currentEvent);
                if (msg) {
                   logXML(msg);
                }
            }
        }


        function resolveUnresolvedMerges(merges: microflows.ExclusiveMerge[], indent) {
            var visits = {};
            var incomingFlowCounts = {};
            var mergeidtomerge = {};
            merges.forEach(merge => {
                if (!(merge.id in visits))
                    visits[merge.id] = 0;
                visits[merge.id] += 1;
                incomingFlowCounts[merge.id] = flowsReversed[merge.id].length;
                mergeidtomerge[merge.id] = merge;
            });
            var remainingUnresolvedFlows = [];
            for (var mergeid in visits) {
                if (visits[mergeid] == incomingFlowCounts[mergeid]) {
                    if (mergeid in flows) {
                        startWalkingBoots(flows[mergeid][0].destination, indent).forEach(x => {
                            remainingUnresolvedFlows.push(x);
                        });
                    }
                } else {
                    for (var i = 0; i < visits[mergeid]; i++) {
                        remainingUnresolvedFlows.push(mergeidtomerge[mergeid]);
                    }
                }
            }
            return remainingUnresolvedFlows;
        }


        if (!(currentEvent.id in flows)) {
            // final destination
            displayBlock(currentEvent, indent);
            return [];
        } else {
            if (flows[currentEvent.id].length == 1) {
                // one-way
                displayBlock(currentEvent, indent);
                var z = startWalkingBoots(flows[currentEvent.id][0].destination, indent);
                return z;
            } else if (flows[currentEvent.id].length == 2 && flows[currentEvent.id].filter(x => x.isErrorHandler).length > 0) {

                // two way try/catch
                // logIndent(indent, 'try {');
                displayBlock(currentEvent, indent + 2);
                // logIndent(indent, '} catch {');
                var exceptionHandler = flows[currentEvent.id].filter(x => x.isErrorHandler)[0].destination;
                var unfinishedMergesInCatch = startWalkingBoots(exceptionHandler, indent + 2);
                if (unfinishedMergesInCatch.length == 1) {
                    // block has to be duplicated and inlined, need to remove this merge from the next unfinishedMerges block
                    var unfinishedMergesAfterInlining = startWalkingBoots(unfinishedMergesInCatch[0], indent + 2, breakOnMerges = false);
                    if (unfinishedMergesAfterInlining.length > 0) {
                        throw 'unresolved merges remain after inlining, can not handle this';
                    }
                } else if (unfinishedMergesInCatch.length > 1) {
                    throw 'Can not resolve multiple unfinished merges in catch block';
                }
                // logIndent(indent, '}');
                var nextFlow = flows[currentEvent.id].filter(x => !x.isErrorHandler)[0].destination;
                var unfinishedMergesAfterTryCatch = startWalkingBoots(nextFlow, indent);
                if (unfinishedMergesAfterTryCatch.length == unfinishedMergesInCatch.length && unfinishedMergesAfterTryCatch.length == 1 && unfinishedMergesInCatch[0] == unfinishedMergesAfterTryCatch[0]) {
                    return startWalkingBoots(unfinishedMergesAfterTryCatch[0], indent, breakOnMerges = false);
                } else {
                    return unfinishedMergesAfterTryCatch;
                }

            } else if (currentEvent instanceof microflows.ExclusiveSplit && flows[currentEvent.id].filter(x => !((<microflows.EnumerationCase>(x.caseValue)).value in { 'true': 1, 'false': 1 })).length > 0) {
                //enumeration split value
                // logIndent(indent, 'switch (' + (<microflows.ExpressionSplitCondition>currentEvent.splitCondition).expression + ') {');
                var destinations: { [destinationid: string]: microflows.SequenceFlow[] } = {};
                
                flows[currentEvent.id].forEach(x => {
                    if (!(x.destination.id in destinations)) {
                        destinations[x.destination.id] = [];
                    }
                    destinations[x.destination.id].push(x);
                });
                // logXML(addXOREvent(currentEvent));
                var unfinishedMerges: microflows.ExclusiveMerge[] = [];
                for (var x in destinations) {
                    // logIndent(indent + 2, '(' + destinations[x].map(l => (<microflows.EnumerationCase>l.caseValue).value).join(' || ') + ') {');
                    startWalkingBoots(destinations[x][0].destination, indent + 4, breakOnMerges = (destinations[x].length != flowsReversed[destinations[x][0].destination.id].length)).forEach(u => {
                        unfinishedMerges.push(u);
                        if (destinations[x][0].destination instanceof microflows.ExclusiveMerge && destinations[x].length != flowsReversed[destinations[x][0].destination.id].length) {
                            for (var i = 1; i < destinations[x].length; i++) {
                                unfinishedMerges.push(u);
                            }
                        }
                    });
                    // logIndent(indent + 2, '},');
                };
                // logIndent(indent, '}');
                return resolveUnresolvedMerges(unfinishedMerges, indent);
            } else if (currentEvent instanceof microflows.InheritanceSplit) {
                // inheritance split
                // logIndent(indent, 'type_of (' + currentEvent.splitVariableName + ') {');
                var destinations: { [destinationid: string]: microflows.SequenceFlow[] } = {};
                flows[currentEvent.id].forEach(x => {
                    if (!(x.destination.id in destinations)) {
                        destinations[x.destination.id] = [];
                    }
                    destinations[x.destination.id].push(x);
                });
                var unfinishedMerges: microflows.ExclusiveMerge[] = [];
                for (var x in destinations) {
                    // logIndent(indent + 2, '(' + destinations[x].map(l => (<microflows.InheritanceCase>l.caseValue).valueQualifiedName).join(' | ') + ') {');
                    startWalkingBoots(destinations[x][0].destination, indent + 4, breakOnMerges = (destinations[x].length != flowsReversed[destinations[x][0].destination.id].length)).forEach(u => {
                        unfinishedMerges.push(u);
                        if (destinations[x][0].destination instanceof microflows.ExclusiveMerge && destinations[x].length != flowsReversed[destinations[x][0].destination.id].length) {
                            for (var i = 1; i < destinations[x].length; i++) {
                                unfinishedMerges.push(u);
                            }
                        }
                    });
                    // logIndent(indent + 2, '},');
                };
                // logIndent(indent, '}');
                return resolveUnresolvedMerges(unfinishedMerges, indent);
            } else if (currentEvent instanceof microflows.ExclusiveSplit && flows[currentEvent.id].filter(x => !((<microflows.EnumerationCase>(x.caseValue)).value in { 'true': 1, 'false': 1 })).length == 0) {
                // true/false split
                var trueHandler = flows[currentEvent.id].filter(x => (<microflows.EnumerationCase>x.caseValue).value == 'true')[0];
                var falseHandler = flows[currentEvent.id].filter(x => (<microflows.EnumerationCase>x.caseValue).value == 'false')[0];
                var unfinishedMerges: microflows.ExclusiveMerge[] = [];
                var conditionCaption = '';
                var condition = currentEvent.splitCondition;
                logXML(addXOREvent(currentEvent,trueHandler,falseHandler));
                if (condition instanceof microflows.ExpressionSplitCondition) {
                    conditionCaption = (<microflows.ExpressionSplitCondition>condition).expression;
                } else if (condition instanceof microflows.RuleSplitCondition) {
                    var c = <microflows.RuleSplitCondition>condition;
                    conditionCaption = c.ruleCall.ruleQualifiedName + '(' + c.ruleCall.parameterMappings.map(x => x.parameterQualifiedName.split('.').splice(2, 1) + '=' + x.argument).join(', ') + ')';
                }

                startWalkingBoots(trueHandler.destination, indent + 2).forEach(u => {
                    unfinishedMerges.push(u);
                });

                startWalkingBoots(falseHandler.destination, indent + 2).forEach(u => {
                    unfinishedMerges.push(u);
                });

                var result = resolveUnresolvedMerges(unfinishedMerges, indent);
                return result;

            }
        }
        throw 'woah, you think you can exit without returning a list of unfinished merges?';
    }
    try {
        var unfinishedMerges = startWalkingBoots(startEvent, 0);
        
            logXML('</Activities><Transitions>');
            
            microflow.flows.forEach(f => {
                if (f instanceof microflows.SequenceFlow) {
                    logXML(createTransitionFlow(f));
                }
                 else if (f instanceof microflows.AnnotationFlow) {
                    logXML(createAnnotationFlow(f));
                }       
            });

            
            
            logXML('</Transitions>');
            logXML(closeXML());
        
        if (unfinishedMerges.length > 0) {
            console.log('unfinished merges!!');
        }
    } catch (e) {
        console.log('unfinished merges!! ' + e);
    }

    console.log('');
    console.log('');
}
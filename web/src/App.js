import React, { useEffect, useState } from "react";
import yaml from "js-yaml";
import ReactFlow, { useNodesState, useEdgesState } from "reactflow";
import { Newspaper, Download } from "lucide-react";
import DataAnalysisTable from "./DataAnalysisTable";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "reactflow/dist/style.css";

function App() {
  const [stageToTaskMap, setStageToTaskMap] = useState({});
  const [selectedStages, setSelectedStages] = useState([]);
  const [filteredDataDict, setFilteredDataDict] = useState({});
  const [availableTaskTypes, setAvailableTaskTypes] = useState([]);
  const [selectedTaskType, setSelectedTaskType] = useState("");
  const [filteredDataAnalysis, setFilteredDataAnalysis] = useState([]);
  const [relatedDataMap, setRelatedDataMap] = useState({});

  useEffect(() => {
    fetch("inputs_all.yaml")
      .then(response => response.text())
      .then(text => {
        const parsedData = yaml.load(text);
        // console.log("Parsed YAML Data:", parsedData);
        const structuredData = structureData(parsedData);
        // console.log("Structured Data:", structuredData);
        setStageToTaskMap(generateStageToTaskMap(structuredData));
        const relatedDataMap = {};
        parsedData["Sheet1"].forEach(row => {
          if (row["Type of data analysis"] && row["Related data"]) {
            relatedDataMap[row["Type of data analysis"]] = row["Related data"];
          }
        });
        setRelatedDataMap(relatedDataMap);
      })
      .catch(error => console.error("Error loading YAML:", error));
  }, []);

  useEffect(() => {
    const originalConsoleError = console.error;

    console.error = (...args) => {
      if (args[0]?.includes("ResizeObserver loop completed with undelivered notifications")) {
        return; // Ignore the warning
      }
      originalConsoleError(...args); // Keep logging other errors
    };

    return () => {
      console.error = originalConsoleError; // Restore original behavior on unmount
    };
  }, []);

  // useEffect(() => {
  //   if (Object.keys(stageToTaskMap).length > 0) {
  //     handleStageChange("Initial seeds");
  //   }
  // }, [stageToTaskMap]);

  const structureData = (parsedData) => {
    if (!parsedData["Sheet1"] || !Array.isArray(parsedData["Sheet1"])) return [];

    return parsedData["Sheet1"].map(row => ({
      stages: row["Stage(s)"] ? row["Stage(s)"].split(", ") : [],
      taskTypes: row["Task type"] ? [row["Task type"]] : [],
      dataAnalysisTypes: row["Type of data analysis"] ? [row["Type of data analysis"]] : []
    }));
  };

  const generateStageToTaskMap = (data) => {
    const stageMap = {};

    data.forEach((entry) => {
      const stageKey = entry.stages.join(", ");
      
      if (!stageMap[stageKey]) {
        stageMap[stageKey] = { taskTypes: new Set(), dataAnalysisMap: {} };
      }

      entry.taskTypes.forEach((task) => {
        stageMap[stageKey].taskTypes.add(task);

        if (!stageMap[stageKey].dataAnalysisMap[task]) {
          stageMap[stageKey].dataAnalysisMap[task] = new Set();
        }

        entry.dataAnalysisTypes.forEach((analysis) => {
          stageMap[stageKey].dataAnalysisMap[task].add(analysis);
        });
      });
    });

    // Convert Sets to Arrays for easier use in UI
    Object.keys(stageMap).forEach((key) => {
      stageMap[key].taskTypes = Array.from(stageMap[key].taskTypes);
      Object.keys(stageMap[key].dataAnalysisMap).forEach((task) => {
        stageMap[key].dataAnalysisMap[task] = Array.from(stageMap[key].dataAnalysisMap[task]);
      });
    });

    // console.log("Updated stage-to-task map with unique analysis types:", stageMap);
    return stageMap;
  };

  const handleStageChange = (stage) => {
    let updatedStages = [...selectedStages];

    if (updatedStages.includes(stage)) {
      updatedStages = updatedStages.filter((s) => s !== stage);
    } else {
      updatedStages.push(stage);
    }

    setSelectedStages(updatedStages);
    // console.log("All stages", updatedStages);

    const taskTypeToAnalysisMap = {}; 
    const matchingTaskTypes = new Set();
    const allDataAnalysisTypes = new Set();

    Object.keys(stageToTaskMap).forEach((key) => {
      const stageSet = new Set(key.toLowerCase().split(", "));
      const selectedSet = new Set(updatedStages.map(s => s.toLowerCase()));

      if ([...selectedSet].every(stage => stageSet.has(stage))) {
        stageToTaskMap[key].taskTypes.forEach((task) => {
          matchingTaskTypes.add(task);

          if (!taskTypeToAnalysisMap[task]) {
            taskTypeToAnalysisMap[task] = new Set();
          }

          if (stageToTaskMap[key].dataAnalysisMap[task]) {
            stageToTaskMap[key].dataAnalysisMap[task].forEach((analysis) => {
              taskTypeToAnalysisMap[task].add(analysis);
              allDataAnalysisTypes.add(analysis);
            });
          }
        });
      }
    });

    // Convert Sets to arrays
    Object.keys(taskTypeToAnalysisMap).forEach(task => {
      taskTypeToAnalysisMap[task] = Array.from(taskTypeToAnalysisMap[task]);
    });

    setFilteredDataDict(taskTypeToAnalysisMap);
    // console.log("Updated Data Dict for stages", taskTypeToAnalysisMap);
    setAvailableTaskTypes(Array.from(matchingTaskTypes));
    console.log(matchingTaskTypes);

    setFilteredDataAnalysis(selectedTaskType ? [] : Array.from(allDataAnalysisTypes));
  };

  const handleTaskTypeChange = (taskType) => {
    // console.log("filtered Data Dict", filteredDataDict[taskType]);
    setSelectedTaskType(taskType);
    setFilteredDataAnalysis(filteredDataDict[taskType] || []);
  };

  const initialNodes = [
    { id: "1", data: { label: "Instrumentation" }, position: { x: 250, y: 5 } },
    { id: "2", data: { label: "Initial seeds" }, position: { x: 250, y: 55 } },
    { id: "3", data: { label: "Search strategy" }, position: { x: 250, y: 105 } },
    { id: "4", data: { label: "Power schedule" }, position: { x: 250, y: 155 } },
    { id: "5", data: { label: "Mutations" }, position: { x: 250, y: 205 } },
    { id: "6", data: { label: "Execution" }, position: { x: 250, y: 255 } },
  ];

  const initialEdges = [
    { id: "e1-2", source: "1", target: "2",  markerEnd: { type: "arrow" }},
    { id: "e2-3", source: "2", target: "3",  markerEnd: { type: "arrow" }},
    { id: "e3-4", source: "3", target: "4",  markerEnd: { type: "arrow" }},
    { id: "e4-5", source: "4", target: "5",  markerEnd: { type: "arrow" }},
    { id: "e5-6", source: "5", target: "6",  markerEnd: { type: "arrow" }},
  ];

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  const updatedNodes = nodes.map((node) => ({
    ...node,
    style: {
      backgroundColor: selectedStages.includes(node.data.label) ? "#2596be" : "#6c757d",
      border: selectedStages.includes(node.data.label) ? "1px solid #2596be" : "1px solid #6c757d",
      padding: "5px",
      textAlign: "center",
      color: selectedStages.includes(node.data.label) ? "#fff" : "#fff"
    },
  }));

  useEffect(() => {
    window.addEventListener("error", (e) => {
      if (e.message.includes("ResizeObserver loop completed with undelivered notifications")) {
        e.stopImmediatePropagation();
      }
    });
  }, []);

  const handleReset = () => {
    setSelectedStages([]);
    setSelectedTaskType("");
    setFilteredDataAnalysis([]);
    setAvailableTaskTypes([]);
  };

  return(
    <div className="App" style={{overflow: "hidden" }}>
      <div className="col navbar navbar-expand-lg" style={{ backgroundColor: "#8c8685", color: "#fff", height: "10vh", borderBottom: "1.5px solid black" }}>
        <div className="col-md-2"></div>
        <div className="col-md-8 text-center">
          <h2 className="m-2" >Visualization Taxonomy to Understand the Fuzzing Internals</h2>
        </div>
        <div className="col-md-2 text-end">
          <a href="http://dx.doi.org/10.1145/3718346" target="_blank" rel="noopener noreferrer" className="me-4" title="Go to the publication">
            <Newspaper size={36} color="#fff" />
          </a>
          <a href="https://doi.org/10.5281/zenodo.15459154" target="_blank" rel="noopener noreferrer" className="me-4" title="Download from Zenodo">
            <Download size={36} color="#fff" />
          </a>
        </div>
      </div>
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-3 col-md-3 text-white align-items-center justify-content-center" style={{ backgroundColor: "#fff", height: "90vh", borderRight: "1.5px solid black" }}>
            <h3 className="text-center mt-4" style={{ color: "#000" }}>Fuzzing internal stages <br /> <small><small><small><small><p className="text-muted">(select stages to display tasks)</p></small></small></small></small></h3>
              <div style={{ width: "100%", height: "75vh" }}>
                <ReactFlow
                      nodes={updatedNodes}
                      edges={edges}
                      nodeTypes={{}}
                      fitView
                      zoomOnScroll={false}
                      zoomOnPinch={false}
                      panOnScroll={false}
                      zoomOnDoubleClick={false}
                      panOnDrag={false}
                      onNodeClick={(event, node) => { handleStageChange(node.data.label); }}
                      style={{width:"2em", padding:"10px", borderRadius:"0px",  cursor:"pointer", margin:"0px"}}
                      proOptions={{hideAttribution: true}}
                />
              </div>
          </div>
          <div className="col-md-9 col-sm-9 justify-content-start p-3 m-0" style={{height: "90vh" }}>
            <div className="row">
              <div className="col-sm-4 col-md-4"></div>
              <div className="col-sm-4 col-md-4">
                <h3 className="text-center">Analysis tasks</h3>
              </div>
              <div className="col-sm-3 col-md-3 text-end">
                <div className="dropdown">
                  <button
                    className="btn btn-secondary dropdown-toggle"
                    type="button"
                    id="taskTypeDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    disabled={availableTaskTypes.length === 0}
                    style={{zIndex: "1050"}}
                  >
                    {selectedTaskType ? selectedTaskType : availableTaskTypes.length === 0 ? "Select stages" : "Select task type"}
                  </button>
                  <ul className="dropdown-menu" aria-labelledby="taskTypeDropdown">
                    {availableTaskTypes.map((taskType) => (
                      <li key={taskType}>
                        <a
                          className={`dropdown-item ${selectedTaskType === taskType ? "active" : ""}`}
                          href="#!"
                          onClick={() => handleTaskTypeChange(taskType)}
                        >
                          {taskType}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="col-sm-1 col-md-1 align-items-center text-center">
                <button 
                  className="btn"
                  style={{
                    width: "auto",
                    height: "36px",
                    backgroundColor: "#2596be",
                    color: "#fff"
                    // borderRadius: "4px",
                  }} 
                  onClick={handleReset}
                >
                  <i className="fas fa-redo text-white align-content-center mr-1 mb-1 p-1"></i>
                </button>
              </div>
            </div>
            <div className="row mt-3 p-4 ">
                {filteredDataAnalysis.length > 0 ? 
                <DataAnalysisTable 
                  filteredDataAnalysis={filteredDataAnalysis} 
                  relatedDataMap={relatedDataMap}
                /> : (
                  <p className="text-muted text-center">Please select one or more stage(s) and task type.</p>
                  // <h1 className="text-muted text-center">Website under construction. Stay tuned!</h1>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;


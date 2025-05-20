import React, { useState } from "react";
import parse from 'html-react-parser'

import "bootstrap/dist/css/bootstrap.min.css";

function DataAnalysisTable({ filteredDataAnalysis, relatedDataMap }) {
  const [hoveredAnalysis, setHoveredAnalysis] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleMouseEnter = (analysis) => {
    setHoveredAnalysis(analysis);
    setModalVisible(true);
  };

  const handleMouseLeave = () => {
    setModalVisible(false);
  };

  return (
    <div style={{ maxHeight: "65vh", overflowY: "auto", border: "3px solid #ddd", borderRadius: "8px", backgroundColor: "#f8f9fa", boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)" }}>
      <table className="table table-striped table-bordered">
        <tbody>
          {filteredDataAnalysis.map((analysis, index) => (
            <tr key={index}>
              {/* <td>{index + 1}</td> */}
              <td
                onMouseEnter={() => handleMouseEnter(analysis)}
                onMouseLeave={handleMouseLeave}
                style={{ position: "relative", cursor: "pointer" }}
              >
                {parse(analysis)}

                {/* Modal tooltip */}
                {modalVisible && hoveredAnalysis === analysis && (
                  <div
                    style={{
                      position: "relative",
                      bottom: "100%",
                      left: "0%",
                      backgroundColor: "white",
                      border: "1px solid #ddd",
                      marginTop: "10px",
                      padding: "10px",
                      // borderRadius: "5px",
                      boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.5)",
                      zIndex: 700,
                      minWidth: "200px",
                    }}
                  >
                    {parse(relatedDataMap[analysis])}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataAnalysisTable;

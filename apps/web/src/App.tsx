import React, { useCallback, useEffect, useState } from "react";
import { RecordsApiV2 } from "@livingsnow/network";
import { TableHeader, TableRow } from "./components/TableRow";

import "./App.css";

function App() {
  const [records, setRecords] = useState<JSX.Element[]>([]);

  const fetchRecords = useCallback(() => {
    RecordsApiV2.getAll()
      .then((response) => {
        const recs = response.data.map((item, index) => (
          <TableRow
            style={{
              backgroundColor: index % 2 === 0 ? "lightgrey" : "lightblue",
            }}
            key={index}
            item={item}
            photos={item.photos}
            onUploadSuccess={fetchRecords}
          />
        ));
        setRecords(recs);
      })
      .catch((error) => console.log(error));
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <div className="App">
      <p>
        This is (obviously) very crude and a work in progress. The goal is to
        build a web app alongside the mobile app for the research team to better
        interact with their data and also for volunteers to further explore
        their contributions.
      </p>
      <br />
      <table>
        <TableHeader />
        <tbody>{records}</tbody>
      </table>
    </div>
  );
}

export default App;

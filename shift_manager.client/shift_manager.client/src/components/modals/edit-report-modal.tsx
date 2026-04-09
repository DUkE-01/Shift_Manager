import { report } from "process";
import { useState } from "react";

const [selectedReport, setSelectedReport] = useState(null);

<button onClick={() => setSelectedReport(report)}>
    Editar
</button>

{
    selectedReport && (
        <div className="modal">
            <input
                value={selectedReport.description}
                onChange={(e) =>
                    setSelectedReport({
                        ...selectedReport,
                        description: e.target.value,
                    })
                }
            />

            <button onClick={handleSave}>Guardar</button>
        </div>
    )
}
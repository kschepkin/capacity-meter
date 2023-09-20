document.getElementById("addMember").addEventListener("click", addMemberRow);
document.getElementById("saveData").addEventListener("click", saveData);
document.getElementById("fileInput").addEventListener("change", loadData);
document.getElementById("startDate").addEventListener("change", updateWorkDays);
document.getElementById("endDate").addEventListener("change", updateWorkDays);

function addMemberRow() {
    const tableBody = document.getElementById("teamTable").getElementsByTagName("tbody")[0];
    const newRow = tableBody.insertRow();

    const nameCell = newRow.insertCell(0);
    const workDaysCell = newRow.insertCell(1);
    const workHoursCell = newRow.insertCell(2);
    const extraHolidaysCell = newRow.insertCell(3);
    const otherActivitiesCell = newRow.insertCell(4);
    const capacityCell = newRow.insertCell(5);
    const actionCell = newRow.insertCell(6);



    nameCell.innerHTML = '<input type="text" class="form-control">';
    workDaysCell.innerHTML = '<input type="number" class="form-control" value="0">';
    workHoursCell.innerHTML = '<input type="number" class="form-control" value="8">';
    extraHolidaysCell.innerHTML = '<input type="number" class="form-control" value="0">';
    otherActivitiesCell.style.position = 'relative';
    otherActivitiesCell.innerHTML = '<input type="number" class="form-control" value="0" style="padding-right: 80px;"> <button id="copyActivity" class="btn btn-small" style="position: absolute; top: 50%; transform: translateY(-50%); right: 10px;">&#11015;</button>';
    
    capacityCell.innerHTML = '<p id="capacity" class="text-center">0</p>';
    actionCell.innerHTML = '<button class="btn btn-danger">X</button>';

    actionCell.querySelector("button").addEventListener("click", function() {
        tableBody.removeChild(newRow);
        calculateTotalCapacity();
    });

    // Add event listeners to inputs for capacity calculations
    workDaysCell.querySelector("input").addEventListener("input", calculateCapacity);
    workHoursCell.querySelector("input").addEventListener("input", calculateCapacity);
    extraHolidaysCell.querySelector("input").addEventListener("input", calculateCapacity);
    otherActivitiesCell.querySelector("input").addEventListener("input", calculateCapacity);

    // Установим рабочие дни для нового сотрудника на основе текущих дат
    updateWorkDaysForNewMember(workDaysCell);
    nameCell.querySelector("input").focus();
    updateWorkDays();
    if (tableBody.rows.length === 1) {  // If it's the first row
        otherActivitiesCell.querySelector("#copyActivity").addEventListener("click", function() {
            const valueToCopy = otherActivitiesCell.querySelector("input").value;
            for (let row of tableBody.rows) {
                if (row !== newRow) {  // Exclude the first row
                    row.cells[4].querySelector("input").value = valueToCopy;
                    calculateCapacity({ target: row.cells[2].querySelector("input") });  // Recalculate capacity
                }
            }
            this.blur();
        });
    } else {
        otherActivitiesCell.querySelector("#copyActivity").remove();  // Remove the copy button for all rows other than the first one
    }
    
}

function calculateCapacity(event) {
    const row = event.target.closest("tr");
    const workDays = parseInt(row.cells[1].querySelector("input").value);
    const workHours = parseInt(row.cells[2].querySelector("input").value);
    const extraHolidays = parseInt(row.cells[3].querySelector("input").value);
    const otherActivitiesDays = parseInt(row.cells[4].querySelector("input").value);

    const capacity = (workDays * workHours) - (extraHolidays * workHours) - (otherActivitiesDays * workHours);
    row.cells[5].querySelector("#capacity").innerText = capacity;

    calculateTotalCapacity();
}


function calculateTotalCapacity() {
    const tableBody = document.getElementById("teamTable").getElementsByTagName("tbody")[0];
    let totalCapacity = 0;

    for (let row of tableBody.rows) {
        const capacity = parseInt(row.cells[5].querySelector("#capacity").innerText);
        totalCapacity += capacity;
    }

    document.getElementById("totalCapacity").innerText = "Общий capacity команды: " + totalCapacity;
}

function updateWorkDaysForNewMember(workDaysCell) {
    const startDate = new Date(document.getElementById("startDate").value);
    const endDate = new Date(document.getElementById("endDate").value);
    let workDays = 0;

    for (let day = startDate; day <= endDate; day.setDate(day.getDate() + 1)) {
        if (day.getDay() !== 0 && day.getDay() !== 6) {  // Exclude Sundays (0) and Saturdays (6)
            workDays++;
        }
    }
    
    workDaysCell.querySelector("input").value = workDays;
}

function updateWorkDays() {
    const tableBody = document.getElementById("teamTable").getElementsByTagName("tbody")[0];
    const startDate = new Date(document.getElementById("startDate").value);
    const endDate = new Date(document.getElementById("endDate").value);
    let workDays = 0;

    for (let day = startDate; day <= endDate; day.setDate(day.getDate() + 1)) {
        if (day.getDay() !== 0 && day.getDay() !== 6) {  // Exclude Sundays (0) and Saturdays (6)
            workDays++;
        }
    }

    for (let row of tableBody.rows) {
        row.cells[1].querySelector("input").value = workDays;
        calculateCapacity({ target: row.cells[2].querySelector("input") });
    }
}


function saveData() {
    const tableBody = document.getElementById("teamTable").getElementsByTagName("tbody")[0];
    const data = {
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value,
        members: []
    };

    for (let row of tableBody.rows) {
        const memberData = {
            name: row.cells[0].querySelector("input").value,
            workHours: row.cells[2].querySelector("input").value,
            extraHolidays: row.cells[3].querySelector("input").value,
            otherActivities: row.cells[4].querySelector("input").value
        };
        data.members.push(memberData);
    }

    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "team_data.json";
    a.click();
}



function loadData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function() {
            const data = JSON.parse(reader.result);
            const tableBody = document.getElementById("teamTable").getElementsByTagName("tbody")[0];
            while (tableBody.rows.length) {
                tableBody.deleteRow(0);
            }
            for (let member of data.members) {
                addMemberRow();
                const newRow = tableBody.rows[tableBody.rows.length - 1];
                newRow.cells[0].querySelector("input").value = member.name;
                newRow.cells[2].querySelector("input").value = member.workHours;
                newRow.cells[3].querySelector("input").value = member.extraHolidays;
                newRow.cells[4].querySelector("input").value = member.otherActivities;
                calculateCapacity({ target: newRow.cells[2].querySelector("input") });
            }
            // Set the start and end dates from the loaded data
            document.getElementById("startDate").value = data.startDate;
            document.getElementById("endDate").value = data.endDate;
            updateWorkDays();  // Update the work days based on the loaded dates
        };
    }
}

window.onload = addMemberRow;

let currentStream = localStorage.getItem('currentStream') || 'default';
let streams = {
    'default': { name: 'Основной', members: [] }
};
let isInitialized = false;

document.addEventListener("DOMContentLoaded", initApp);

window.onerror = function(message, source, lineno, colno, error) {
    console.error("Произошла ошибка:", error);
    alert("Произошла ошибка при загрузке страницы. Пожалуйста, обновите страницу или свяжитесь с администратором.");
    return true;
};

function isValidData(data) {
    return data && 
           typeof data === 'object' && 
           data.streams && 
           typeof data.streams === 'object' &&
           data.startDate && 
           data.endDate;
}

function resetToInitialState() {
    streams = {
        'default': { name: 'Основной', members: [] }
    };
    currentStream = 'default';
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    updateStreamSelect();
    
    const teamTable = document.getElementById("teamTable");
    if (teamTable) {
        const tbody = teamTable.getElementsByTagName("tbody")[0];
        if (tbody) {
            tbody.innerHTML = '';
        }
    }
    
    initVacationTable();
    calculateTotalCapacity();
}

function addMemberRow(member = {}) {
    const tableBody = document.getElementById("teamTable").getElementsByTagName("tbody")[0];
    if (!tableBody) {
        console.error("Тело таблицы не найдено");
        return;
    }
    const newRow = tableBody.insertRow();

    const cells = ['name', 'workDays', 'workHours', 'extraHolidays', 'otherActivities', 'capacity', 'actions'];
    cells.forEach((cell, index) => {
        const newCell = newRow.insertCell(index);
        switch(cell) {
            case 'name':
                newCell.innerHTML = `<input type="text" class="form-control" value="${member.name || ''}">`;
                break;
            case 'workDays':
                newCell.innerHTML = `<input type="number" class="form-control" value="${member.workDays || 0}">`;
                break;
            case 'workHours':
                newCell.innerHTML = `<input type="number" class="form-control" value="${member.workHours || 8}">`;
                break;
            case 'extraHolidays':
                newCell.innerHTML = `<input type="number" class="form-control" value="${member.extraHolidays || 0}">`;
                break;
            case 'otherActivities':
                newCell.innerHTML = `
                    <div class="input-group">
                        <input type="number" class="form-control" value="${member.otherActivities || 0}">
                        <button class="btn btn-outline-secondary apply-to-all" type="button" title="Применить ко всем">↓</button>
                    </div>`;
                break;
            case 'capacity':
                newCell.innerHTML = '<p id="capacity" class="text-center">0</p>';
                break;
            case 'actions':
                newCell.innerHTML = `
                    <div class="btn-group" role="group">
                        <button class="btn btn-danger btn-sm">X</button>
                        <button class="btn btn-info btn-sm addVacation">Отпуск</button>
                    </div>`;
                break;
        }
        
    });

    newRow.querySelector(".btn-danger").addEventListener("click", function() {
        const memberIndex = Array.from(tableBody.rows).indexOf(newRow);
        streams[currentStream].members.splice(memberIndex, 1);
        tableBody.removeChild(newRow);
        calculateTotalCapacity();
        updateVacationTable();
        saveToLocalStorage();
    });

    newRow.querySelector(".addVacation").addEventListener("click", function() {
        showVacationModal(newRow);
    });

    newRow.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', function() {
            updateMemberData(newRow);
            calculateCapacity({ target: newRow.cells[2].querySelector("input") });
        });
    });

    newRow.querySelector(".apply-to-all").addEventListener("click", function() {
        const value = this.parentElement.querySelector("input").value;
        applyOtherActivitiesToAll(value);
    });

    if (!member.workDays) {
        updateWorkDaysForNewMember(newRow.cells[1]);
    }
    calculateCapacity({ target: newRow.cells[2].querySelector("input") });

    if (!member.name) {
        streams[currentStream].members.push({
            name: '',
            workDays: 0,
            workHours: 8,
            extraHolidays: 0,
            otherActivities: 0,
            vacations: []
        });
    }
    saveToLocalStorage();
}

function applyOtherActivitiesToAll(value) {
    const tableBody = document.getElementById("teamTable").getElementsByTagName("tbody")[0];
    for (let row of tableBody.rows) {
        const otherActivitiesInput = row.cells[4].querySelector("input");
        otherActivitiesInput.value = value;
        updateMemberData(row);
        calculateCapacity({ target: row.cells[2].querySelector("input") });
    }
    saveToLocalStorage();
}

function initApp() {
    if (isInitialized) return;
    isInitialized = true;

    const addMemberButton = document.getElementById("addMember");
    const saveDataButton = document.getElementById("saveData");
    const fileInput = document.getElementById("fileInput");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const streamSelect = document.getElementById("streamSelect");
    const addStreamButton = document.getElementById("addStream");
    const deleteStreamButton = document.getElementById("deleteStream");

    if (addMemberButton) addMemberButton.addEventListener("click", addMemberRow);
    if (saveDataButton) saveDataButton.addEventListener("click", saveData);
    if (fileInput) fileInput.addEventListener("change", loadData);
    if (startDateInput) startDateInput.addEventListener("change", updateWorkDays);
    if (endDateInput) endDateInput.addEventListener("change", updateWorkDays);
    if (streamSelect) streamSelect.addEventListener("change", changeStream);
    if (addStreamButton) addStreamButton.addEventListener("click", addNewStream);
    if (deleteStreamButton) deleteStreamButton.addEventListener("click", deleteStream);

    try {
        const savedData = localStorage.getItem('teamData');
        if (savedData) {
            const data = JSON.parse(savedData);
            if (isValidData(data)) {
                streams = data.streams;
                if (startDateInput) startDateInput.value = data.startDate || '';
                if (endDateInput) endDateInput.value = data.endDate || '';
                updateStreamSelect();
                
                if (streams[currentStream]) {
                    changeStream(currentStream);
                } else {
                    currentStream = Object.keys(streams)[0];
                    changeStream(currentStream);
                }
            } else {
                console.error("Некорректные данные в localStorage");
                resetToInitialState();
            }
        } else {
            console.log("Данные в localStorage отсутствуют");
            resetToInitialState();
        }
    } catch (error) {
        console.error("Ошибка при загрузке данных из localStorage:", error);
        resetToInitialState();
    }
    
    initVacationTable();
}

function updateMemberData(row) {
    const memberIndex = Array.from(row.parentNode.children).indexOf(row);
    streams[currentStream].members[memberIndex] = {
        ...streams[currentStream].members[memberIndex],
        name: row.cells[0].querySelector("input").value,
        workDays: parseInt(row.cells[1].querySelector("input").value) || 0,
        workHours: parseInt(row.cells[2].querySelector("input").value) || 0,
        extraHolidays: parseInt(row.cells[3].querySelector("input").value) || 0,
        otherActivities: parseInt(row.cells[4].querySelector("input").value) || 0
    };
    calculateCapacity({ target: row.cells[2].querySelector("input") });
    saveToLocalStorage();
}

function calculateCapacity(event) {
    const row = event.target.closest("tr");
    const workDays = parseInt(row.cells[1].querySelector("input").value) || 0;
    const workHours = parseInt(row.cells[2].querySelector("input").value) || 0;
    const extraHolidays = parseInt(row.cells[3].querySelector("input").value) || 0;
    const otherActivitiesDays = parseInt(row.cells[4].querySelector("input").value) || 0;

    const capacity = (workDays - extraHolidays - otherActivitiesDays) * workHours;
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

    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
        if (day.getDay() !== 0 && day.getDay() !== 6) {
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

    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
        if (day.getDay() !== 0 && day.getDay() !== 6) {
            workDays++;
        }
    }

    for (let row of tableBody.rows) {
        row.cells[1].querySelector("input").value = workDays;
        calculateCapacity({ target: row.cells[2].querySelector("input") });
    }
    saveToLocalStorage();
}

function saveData() {
    saveToLocalStorage();
    
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const data = { streams: streams, startDate: startDate, endDate: endDate };

    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const formattedStartDate = formatDate(new Date(startDate));
    const formattedEndDate = formatDate(new Date(endDate));
    a.download = `team_${formattedStartDate}-${formattedEndDate}.json`;
    a.click();
}

function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
}

function loadData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function() {
            try {
                const data = JSON.parse(reader.result);
                if (isValidData(data)) {
                    streams = data.streams;
                    const startDateInput = document.getElementById("startDate");
                    const endDateInput = document.getElementById("endDate");
                    if (startDateInput) startDateInput.value = data.startDate;
                    if (endDateInput) endDateInput.value = data.endDate;
                    updateStreamSelect();
                    changeStream(currentStream);
                    
                    // Обновляем extra holidays для каждого участника
                    const tableBody = document.getElementById("teamTable").getElementsByTagName("tbody")[0];
                    streams[currentStream].members.forEach((member, index) => {
                        updateExtraHolidays(tableBody.rows[index], index);
                    });

                    initVacationTable();
                    updateOnManualInput();
                    saveToLocalStorage();
                } else {
                    throw new Error("Некорректные данные в файле");
                }
            } catch (error) {
                console.error("Ошибка при загрузке данных из файла:", error);
                alert("Ошибка при загрузке данных из файла. Пожалуйста, проверьте формат файла.");
            }
        };
    }
}

function changeStream(newStream) {
    if (newStream && typeof newStream === 'string') {
        currentStream = newStream;
    } else if (newStream && newStream.target) {
        currentStream = newStream.target.value;
    } else {
        currentStream = document.getElementById("streamSelect").value;
    }
    const tableBody = document.getElementById("teamTable").getElementsByTagName("tbody")[0];
    tableBody.innerHTML = '';
    if (streams[currentStream] && streams[currentStream].members) {
        streams[currentStream].members.forEach((member, index) => {
            if (member.name && member.name.trim() !== '') { 
                addMemberRow(member);
                updateExtraHolidays(tableBody.rows[index], index);
            }
        });
    }
    updateWorkDays();
    initVacationTable(); // Инициализируем таблицу отпусков при смене стрима
    updateVacationTable();
    updateOnManualInput();
    
    // Обновляем выбранный стрим в select
    const streamSelect = document.getElementById("streamSelect");
    if (streamSelect) {
        streamSelect.value = currentStream;
    }
    
    saveToLocalStorage();
}

function addNewStream() {
    const streamName = prompt("Введите название нового стрима:");
    if (streamName) {
        const streamId = streamName.toLowerCase().replace(/\s+/g, '_');
        streams[streamId] = { name: streamName, members: [] };
        updateStreamSelect();
        currentStream = streamId;
        changeStream(currentStream);
        saveToLocalStorage();
    }
}

function deleteStream() {
    if (Object.keys(streams).length === 1) {
        if (confirm("Это единственный стрим. Удаление приведет к очистке всех данных. Вы уверены?")) {
            streams = {
                'default': { name: 'Основной', members: [] }
            };
            currentStream = 'default';
            document.getElementById("startDate").value = '';
            document.getElementById("endDate").value = '';
            
            localStorage.removeItem('teamData');
            
            updateStreamSelect();
            changeStream(currentStream);
            initVacationTable();
            
            alert("Все данные очищены.");
        }
    } else if (confirm(`Вы уверены, что хотите удалить стрим "${streams[currentStream].name}"?`)) {
        delete streams[currentStream];
        currentStream = Object.keys(streams)[0];
        updateStreamSelect();
        changeStream(currentStream);
        saveToLocalStorage();
    }
}

function updateStreamSelect() {
    const select = document.getElementById("streamSelect");
    select.innerHTML = '';
    for (let streamId in streams) {
        const option = document.createElement("option");
        option.value = streamId;
        option.textContent = streams[streamId].name;
        select.appendChild(option);
    }
    select.value = currentStream;
}

function showVacationModal(row) {
    const modal = new bootstrap.Modal(document.getElementById('vacationModal'));
    const saveButton = document.getElementById('saveVacation');
    const vacationStart = document.getElementById('vacationStart');
    const vacationEnd = document.getElementById('vacationEnd');
    
    saveButton.onclick = function() {
        if (new Date(vacationStart.value) > new Date(vacationEnd.value)) {
            alert("Дата начала отпуска не может быть позже даты окончания!");
            return;
        }
        
        const memberIndex = Array.from(row.parentNode.children).indexOf(row);
        streams[currentStream].members[memberIndex].vacations.push({start: vacationStart.value, end: vacationEnd.value});
        
        updateExtraHolidays(row, memberIndex);
        modal.hide();
        saveToLocalStorage();
    };
    
    modal.show();
}


function updateExtraHolidays(row, memberIndex) {
    const startDate = new Date(document.getElementById("startDate").value);
    const endDate = new Date(document.getElementById("endDate").value);
    let extraHolidays = 0;

    streams[currentStream].members[memberIndex].vacations.forEach(vacation => {
        const vacationStart = new Date(vacation.start);
        const vacationEnd = new Date(vacation.end);

        if (isNaN(vacationStart.getTime()) || isNaN(vacationEnd.getTime())) {
            console.error("Некорректные даты отпуска:", vacation);
            return;
        }

        // Учитываем только дни отпуска, попадающие в период спринта
        const effectiveStart = new Date(Math.max(startDate, vacationStart));
        const effectiveEnd = new Date(Math.min(endDate, vacationEnd));

        for (let day = effectiveStart; day <= effectiveEnd; day.setDate(day.getDate() + 1)) {
            if (day.getDay() !== 0 && day.getDay() !== 6) { // Исключаем выходные
                extraHolidays++;
            }
        }
        updateVacationTable();
    });

    row.cells[3].querySelector("input").value = extraHolidays;
    streams[currentStream].members[memberIndex].extraHolidays = extraHolidays;
    calculateCapacity({ target: row.cells[2].querySelector("input") });
    saveToLocalStorage();
}

function updateVacationTable() {
    const vacationTable = document.getElementById("vacationTable");
    if (!vacationTable) {
        console.warn("Таблица отпусков не найдена");
        initVacationTable(); // Создаем таблицу, если она не найдена
        return;
    }
    
    const vacationTableBody = vacationTable.getElementsByTagName("tbody")[0];
    if (!vacationTableBody) {
        console.warn("Тело таблицы отпусков не найдено");
        return;
    }
    
    vacationTableBody.innerHTML = '';

    if (!streams[currentStream] || !streams[currentStream].members) {
        console.warn("Данные о членах текущего стрима отсутствуют");
        return;
    }

    streams[currentStream].members.forEach((member, index) => {
        if (!member.vacations) {
            console.warn(`У члена команды ${member.name} отсутствует массив отпусков`);
            return;
        }
        member.vacations.forEach(vacation => {
            const row = vacationTableBody.insertRow();
            row.insertCell(0).textContent = member.name;
            row.insertCell(1).textContent = vacation.start;
            row.insertCell(2).textContent = vacation.end;
            
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Удалить";
            deleteButton.className = "btn btn-danger btn-sm";
            deleteButton.onclick = function() {
                member.vacations = member.vacations.filter(v => v !== vacation);
                updateExtraHolidays(document.getElementById("teamTable").rows[index], index);
                updateVacationTable();
                saveToLocalStorage();
                location.reload(); //TODO: поменять и сделать норм обработку при удалении
            };
            row.insertCell(3).appendChild(deleteButton);
            
        });
    });
}

function initVacationTable() {
    const container = document.getElementById('vacationTableContainer');
    if (!container) return;
    
    container.innerHTML = ''; // Очищаем контейнер перед добавлением новой таблицы
    
    const vacationTable = document.createElement('table');
    vacationTable.id = 'vacationTable';
    vacationTable.className = 'table table-bordered mt-4';
    vacationTable.innerHTML = `
        <thead>
            <tr>
                <th>Сотрудник</th>
                <th>Начало отпуска</th>
                <th>Конец отпуска</th>
                <th>Действия</th> 
            </tr>
        </thead>
        <tbody></tbody>
    `;
    container.appendChild(vacationTable);
    updateVacationTable();
}



function saveToLocalStorage() {
    const data = {
        streams: streams,
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value
    };
    try {
        localStorage.setItem('teamData', JSON.stringify(data));
        localStorage.setItem('currentStream', currentStream);
    } catch (error) {
        console.error("Ошибка при сохранении данных:", error);
        alert("Не удалось сохранить данные. Возможно, превышен лимит хранилища.");
    }
}

function updateOnManualInput() {
    const tableBody = document.getElementById("teamTable").getElementsByTagName("tbody")[0];
    for (let row of tableBody.rows) {
        row.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', function() {
                updateMemberData(row);
                calculateCapacity({ target: row.cells[2].querySelector("input") });
            });
        });
    }
}

// Вызываем функцию updateOnManualInput при инициализации приложения
document.addEventListener("DOMContentLoaded", function() {
    initApp();
    initVacationTable();
    updateOnManualInput();
});

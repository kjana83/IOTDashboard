var io = io.connect();

var chart = c3.generate({
    bindto: '#graph',
    data: {
        x: 'x',
        columns: [
        ]
    },
    axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: '%X'
            }
        }
    }
});
toastr.info('Started');
var DATA_POINT_COUNT = 20;
var LABEL_PREFIXES = /^avg|^min|^max/;
var labels = null;
var columns = [];

var appendColumn = function (index, label, value) {
    if(!value){
        console.log('value is null ' + label + ' is skipped');
    } else{
        if (columns.length <= index) {
            columns.push([label]);
        }
        columns[index].push(value);
        if (columns[index].length > DATA_POINT_COUNT) {
            columns[index].splice(1, 1);
        }
        if (value>27 && value<=28)
            toastr.warning('Temperature increased to ' + value);
        if (value>28)
            toastr.error('Temperature spiked to ' + value);
    }
};

var initializeLabels = function (data) {
    labels = [];
    Object.keys(data).forEach(function (key) {
        if (LABEL_PREFIXES.test(key)) {
            labels.push(key);
        }
    });
};

io.on('data', function (incomingData) {
    // Initialize labels from incoming data
    if (labels === null) {
        initializeLabels(incomingData);
    }
    if(incomingData.timestamp){
        appendColumn(0, 'x', new Date(incomingData.timestamp));
        for (var i = 0; i < labels.length; i++) {
            appendColumn(i + 1, labels[i], incomingData[labels[i]]);
        }
    }else{
        console.log('bad timestamp is skipped');   
    }
    chart.load({
        columns: columns
    });
});

// Listen for session event.
io.emit('ready');

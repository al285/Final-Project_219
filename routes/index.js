var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var busboy = require('connect-busboy');
var University = mongoose.model('university');
var helper = require(__dirname + '/helper');

router.use(busboy());

// GET HOME 
router.get('/', function(req, res, next) {
  res.render('index', { title: 'IS219 Final Home' });
});

// GET UPLOAD
router.get('/upload', function(req, res) {
    res.render('upload_landing', { title: 'Upload | Start' })
})

// GET QUNIT
router.get('/test', function(req, res) {
    res.render('test', { title: 'Unit Testing' })
})

/*************************** QUESTION ROUTES **************************/


// GET ENROLLMENT 
router.get('/most_enrolled', function(req, res) {
    res.render('year', {
	title: "Most Enrolled | Year",
	route: 'most_enrolled'
    })
})

// GET ENROLLMENT YEAR
router.get('/most_enrolled/:year', function(req, res) {
    var year = 'y' + req.params.year;
    var query = {};
    var year_sort = {};

    // QUERY/OPTIONS
    query[year + '.enroll'] = true;
    year_sort[year + '.total'] = -1;

    // find top ten most enrolled colleges
    University.find(query).sort(year_sort).limit(10).find(
	function(err, records){
	    helper.renderTopTen(res, records, year)
	}
    )
})

// GET GENDER 
router.get('/gender_distribution/:year/:id', function(req, res) {
    University.findById(
	req.params.id,
	{},
	function(err, record) {
	    // Document
	    var year_record = record['y' + req.params.year];

	    // Percents
	    var percent = {};
	    percent.male = helper.percent(year_record.total, year_record.male, 1);
	    percent.female = helper.percent(year_record.total, year_record.female, 1);
	    console.log(year_record)

	    // Render
	    res.render('pieGraph', {
		title: 'Gender Distribution | ' + record.name,
		rec: year_record,
		percent: percent
	    })
	}
    )
})

// GET GENDER YEAR
router.get('/gender_distribution', function(req, res) {
    res.render('year', {
	title: "Gender Distribution | Year",
	route: 'gender_distribution'
    })
})

// GET GENDER FOR YEAR
router.get('/gender_distribution/:year', function(req, res) {
    var year = req.params.year;
    var query = {};

    query['y' + year + '.enroll'] = true;

    University.find(
	query,
	{},
	function (err, list) {
	    res.render('list', {
		title: "Gender Distribution | List",
		rec: list,
		route: 'gender_distribution/' + year,
	    })
	}
    )
})


// GET TUITION
router.get('/tuition', function(req, res) {
    University.find(
	{
	    'y2013.enroll': true, 
	    'y2012.enroll': true, 
	    'y2011.enroll': true
	},
	{
	    name: 1
	},
	function(err, list) {
	    res.render('list', {
		title: 'Tuition | List',
		rec: list,
		route: 'tuition'
	    })
	}
    )
})

// GET TUITION GRAPH
router.get('/tuition/:id', function(req, res) {
    University.findById(
	req.params.id,
	{},
	function(err, record) {
	    console.log(record)
	    res.render('lineGraph', {
		title: 'Tuition | ' + record.name,
		rec: record
	    })
	}
    )
})

/*********************** ROUTES for 2013 ******************************/

// GET upload page for 2013 characteristics 
router.get('/upload/2013/characteristics', function(req, res) {
    res.render('upload', {
	title: 'Upload | University Characteristics 2013',
	route: '2013/chars',
	fileName: 'hd2013.csv'
    })
})

// POST uploads 2013 characteristics 
router.post('/fileupload/2013/chars', function(req, res) {
    helper.getRecords(req, res, University, '2013/enrollment', function(record, Schema) {
	var id = record.UNITID;
	console.log(id)
        University({_id: id, name: record.INSTNM}).save(function(err) {
            if (err) return console.error(err);
        })
    })
})

// GET upload page for 2013 enrollment data 
router.get('/upload/2013/enrollment', function(req, res) {
    res.render('upload', {
	title: 'Upload | Enrollment 2013',
	route: '2013/enroll',
	fileName: 'ef2013a.csv'
    })
})

// POST save enrollment data to database 
router.post('/fileupload/2013/enroll', function(req, res) {
    helper.getRecords(req, res, University, '2013/finance', function(record, Schema) {
	var id = record.UNITID;
	console.log(id)

	// increment the data and set to enroll to true
	Schema.findByIdAndUpdate(id, {$inc: {
	    'y2013.total': record.EFTOTLT,
	    'y2013.male': record.EFTOTLM,
	    'y2013.female': record.EFTOTLW
	},
	$set: { 'y2013.enroll': true}},
	function(err) {
	     if (err) return console.error(err);
	 }
	);
    })
})

// GET for 2013 finance page 
router.get('/upload/2013/finance', function(req, res) {
    res.render('upload', {
	title: 'Upload | 2013 Finance',
	route: '2013/fin',
	fileName: 'f1213_f1a.csv'
    })
})

// POST saves finance data to database 
router.post('/fileupload/2013/fin', function(req, res) {
    helper.getRecords(req, res, University, '2012/enrollment', function(record, Schema) {
	var id = record.UNITID;
	var tuition = record.F1B01;
	console.log(id + ' | ' + tuition)

	// set the finance data
	Schema.findByIdAndUpdate(
	    id, 
	    {$set: {'y2013.tuition': tuition,'y2013.finance': true}},
	    function(err) {
		if (err) return console.error(err);
	    }
	)
    })
})

/****************************** 2012 *********************************/

// GET upload page for 2012 enrollment data 
router.get('/upload/2012/enrollment', function(req, res) {
    res.render('upload', {
	title: 'Upload | Enrollment 2012',
	route: '2012/enroll',
	fileName: 'ef2012a.csv'
    })
})

// POST save enrollment data to database 
router.post('/fileupload/2012/enroll', function(req, res) {
    helper.getRecords(req, res, University, '2012/finance', function(record, Schema) {
	var id = record.UNITID;
	console.log(id)

	// increment the data and set enroll to true
	Schema.findByIdAndUpdate(id, {$inc: {
	    'y2012.total': record.EFTOTLT,
	    'y2012.male': record.EFTOTLM,
	    'y2012.female': record.EFTOTLW
	},
	$set: { 'y2012.enroll': true}},
	function(err) {
	     if (err) return console.error(err);
	 }
	);
    })
})

// GET for 2012 finance page 
router.get('/upload/2012/finance', function(req, res) {
    res.render('upload', {
	title: 'Upload | 2012 Finance',
	route: '2012/fin',
	fileName: 'f1112_f1a.csv'
    })
})

// POST saves finance data to database 
router.post('/fileupload/2012/fin', function(req, res) {
    helper.getRecords(req, res, University, '2011/enrollment', function(record, Schema) {
	var id = record.UNITID;
	var tuition = record.F1B01;
	console.log(id + ' | ' + tuition)

	// set the finance data
	Schema.findByIdAndUpdate(
	    id, 
	    {
		$set: {'y2012.tuition': tuition,'y2012.finance': true}
	    },
	    function(err) {
		if (err) return console.error(err);
	    }
	)
    })
})


/****************************** 2011  *********************************/

// GET upload page for 2011 enrollment data 
router.get('/upload/2011/enrollment', function(req, res) {
    res.render('upload', {
	title: 'Upload | Enrollment 2011',
	route: '2011/enroll',
	fileName: 'ef2011a.csv'
    })
})

// POST save enrollment data to database 
router.post('/fileupload/2011/enroll', function(req, res) {
    helper.getRecords(req, res, University, '2011/finance', function(record, Schema) {
	var id = record.UNITID;
	console.log(id)

	// increment the data and set enroll to true
	Schema.findByIdAndUpdate(id, {$inc: {
	    'y2011.total': record.EFTOTLT,
	    'y2011.male': record.EFTOTLM,
	    'y2011.female': record.EFTOTLW
	},
	$set: { 'y2011.enroll': true}},
	function(err) {
	     if (err) return console.error(err);
	 }
	);
    })
})

// GET for 2011 finance page 
router.get('/upload/2011/finance', function(req, res) {
    res.render('upload', {
	title: 'Upload | 2011 Finance',
	route: '2011/fin',
	fileName: 'f1011_f1a.csv'
    })
})

// POST saves finance data to database 
router.post('/fileupload/2011/fin', function(req, res) {

    // get records from csv file
    helper.getRecords(req, res, University, 'complete', function(record, Schema) {
	var id = record.UNITID;
	var tuition = record.F1B01;
	console.log(id + ' | ' + tuition)

	// set the finance data
	Schema.findByIdAndUpdate(
	    id, 
	    {$set: {'y2011.tuition': tuition,'y2011.finance': true}},
	    function(err) {
		if (err) return console.error(err);
	    }
	)
    })
})

// GET final page for upload 
router.get('/upload/complete', function(req, res) {
    res.render('complete', {title: 'Upload | Complete'})
})

module.exports = router;

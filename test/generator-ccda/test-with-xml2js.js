"use strict;";

var expect = require('chai').expect;

var fs = require("fs");
var path = require('path');
var mkdirp = require('mkdirp');
var xml2js = require('xml2js');
var bb = require('../../index.js');

describe('xml vs parse generate xml ', function () {
    var generatedDir = null;

    before(function () {
        generatedDir = path.join(__dirname, "../fixtures/files/parse_gen_parse/generated");
        mkdirp.sync(generatedDir);
        expect(generatedDir).to.exist;
    });

    describe('CCD_1.xml', function () {
        var toSections = function (ccd) {
            expect(ccd.ClinicalDocument).to.exist;
            expect(ccd.ClinicalDocument.component).to.exist;
            expect(ccd.ClinicalDocument.component[0]).to.exist;
            expect(ccd.ClinicalDocument.component[0].structuredBody).to.exist;
            expect(ccd.ClinicalDocument.component[0].structuredBody[0]).to.exist;
            expect(ccd.ClinicalDocument.component[0].structuredBody[0].component).to.exist;
            return ccd.ClinicalDocument.component[0].structuredBody[0].component;
        };

        var findSection = function (sections, templateId) {
            var n = sections.length;
            for (var i = 0; i < n; ++i) {
                var sectionInfo = sections[i].section[0];
                var ids = sectionInfo.templateId;
                if (ids) {
                    for (var j = 0; j < ids.length; ++j) {
                        var id = ids[j];
                        if (id['$'].root === templateId) {
                            return sections[i].section[0]
                        }
                    }
                }
            }
            return null;
        };

        var xml;
        var xmlGenerated;
        var sections;
        var sectionsGenerated;

        it('create xml and generated xml', function () {
            xml = fs.readFileSync("./test/fixtures/generator-ccda/CCD_1.xml").toString();

            // convert nto JSON 
            var result = bb.parseString(xml);
            var val = bb.validator.validateDocumentModel(result);
            var err = bb.validator.getLastError();
            expect(err.valid).to.be.true;

            // generate ccda
            xmlGenerated = bb.generateCCDA(result).toString();
        });

        it('xml2js oiginal', function (done) {
            var parser = new xml2js.Parser();
            parser.parseString(xml, function (err, result) {
                sections = toSections(result);
                done(err);
            });
        });

        it('xml2js generated', function (done) {
            var parser = new xml2js.Parser();
            parser.parseString(xmlGenerated, function (err, result) {
                sectionsGenerated = toSections(result);
                done(err);
            });
        });

        it('allergies', function () {
            var allergies = findSection(sections, "2.16.840.1.113883.10.20.22.2.6");
            var allergiesGenerated = findSection(sectionsGenerated, "2.16.840.1.113883.10.20.22.2.6");
            expect(allergies).to.exist;

            // ignore allergies text
            delete allergies.text;
            delete allergiesGenerated.text;

            expect(allergiesGenerated).to.exist;
            //expect(allergiesGenerated).to.deep.equal(allergies);
        });
    });
});

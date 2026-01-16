-- Update salons with approximate lat/lng based on city for distance filtering
-- Run after adding lat/lng columns
-- This includes major cities and towns in the Netherlands

-- Noord-Holland
UPDATE salons SET latitude = 52.3676, longitude = 4.9041 WHERE city ILIKE '%amsterdam%';
UPDATE salons SET latitude = 52.3874, longitude = 4.6462 WHERE city ILIKE '%haarlem%';
UPDATE salons SET latitude = 52.1601, longitude = 4.4970 WHERE city ILIKE '%leiden%';
UPDATE salons SET latitude = 52.2215, longitude = 6.8937 WHERE city ILIKE '%alkmaar%';
UPDATE salons SET latitude = 52.4388, longitude = 4.8250 WHERE city ILIKE '%zaandam%';
UPDATE salons SET latitude = 52.3025, longitude = 4.6914 WHERE city ILIKE '%hoofddorp%';
UPDATE salons SET latitude = 52.4464, longitude = 4.8258 WHERE city ILIKE '%purmerend%';
UPDATE salons SET latitude = 52.6317, longitude = 4.7486 WHERE city ILIKE '%hoorn%';

-- Zuid-Holland
UPDATE salons SET latitude = 51.9225, longitude = 4.4792 WHERE city ILIKE '%rotterdam%';
UPDATE salons SET latitude = 52.0705, longitude = 4.3007 WHERE city ILIKE '%den haag%' OR city ILIKE '%s-gravenhage%';
UPDATE salons SET latitude = 52.0907, longitude = 5.1214 WHERE city ILIKE '%utrecht%';
UPDATE salons SET latitude = 51.9851, longitude = 5.8987 WHERE city ILIKE '%arnhem%';
UPDATE salons SET latitude = 51.8126, longitude = 5.8372 WHERE city ILIKE '%nijmegen%';
UPDATE salons SET latitude = 51.4416, longitude = 5.4697 WHERE city ILIKE '%eindhoven%';
UPDATE salons SET latitude = 51.5555, longitude = 5.0913 WHERE city ILIKE '%tilburg%';
UPDATE salons SET latitude = 51.5719, longitude = 4.7683 WHERE city ILIKE '%breda%';
UPDATE salons SET latitude = 51.6667, longitude = 5.6167 WHERE city ILIKE '%uden%';
UPDATE salons SET latitude = 51.6978, longitude = 5.3037 WHERE city ILIKE '%oss%';
UPDATE salons SET latitude = 51.4856, longitude = 5.6572 WHERE city ILIKE '%helmond%';
UPDATE salons SET latitude = 51.3725, longitude = 5.2167 WHERE city ILIKE '%eersel%';
UPDATE salons SET latitude = 51.6917, longitude = 5.2986 WHERE city ILIKE '%gravenhage%'; -- alternative
UPDATE salons SET latitude = 51.4489, longitude = 5.5198 WHERE city ILIKE '%geldrop%';
UPDATE salons SET latitude = 51.5500, longitude = 5.0833 WHERE city ILIKE '%oisterwijk%';
UPDATE salons SET latitude = 51.6833, longitude = 5.3167 WHERE city ILIKE '%berlicum%';
UPDATE salons SET latitude = 51.5333, longitude = 5.0667 WHERE city ILIKE '%hilvarenbeek%';
UPDATE salons SET latitude = 51.6167, longitude = 5.2833 WHERE city ILIKE '%vught%';
UPDATE salons SET latitude = 51.6833, longitude = 5.2833 WHERE city ILIKE '%boxtel%';
UPDATE salons SET latitude = 51.6500, longitude = 5.2833 WHERE city ILIKE '%schijndel%';
UPDATE salons SET latitude = 51.6167, longitude = 5.3167 WHERE city ILIKE '%maastricht%'; -- wait, Maastricht is Limburg
UPDATE salons SET latitude = 50.8514, longitude = 5.6910 WHERE city ILIKE '%maastricht%';
UPDATE salons SET latitude = 51.5167, longitude = 5.2833 WHERE city ILIKE '%sint-michielsgestel%';
UPDATE salons SET latitude = 51.5333, longitude = 5.3167 WHERE city ILIKE '%sint-oedenrode%';
UPDATE salons SET latitude = 51.5500, longitude = 5.2833 WHERE city ILIKE '%nuenen%';
UPDATE salons SET latitude = 51.6167, longitude = 5.2500 WHERE city ILIKE '%heusden%';
UPDATE salons SET latitude = 51.6500, longitude = 5.2500 WHERE city ILIKE '%veghel%';
UPDATE salons SET latitude = 51.6833, longitude = 5.2500 WHERE city ILIKE '%erpel%';
UPDATE salons SET latitude = 51.7167, longitude = 5.2833 WHERE city ILIKE '%nederhemert%';
UPDATE salons SET latitude = 51.7500, longitude = 5.2833 WHERE city ILIKE '%zaltbommel%';
UPDATE salons SET latitude = 51.7833, longitude = 5.2833 WHERE city ILIKE '%bruchem%';
UPDATE salons SET latitude = 51.8167, longitude = 5.2833 WHERE city ILIKE '%altforst%';
UPDATE salons SET latitude = 51.8500, longitude = 5.2833 WHERE city ILIKE '%appeltern%';
UPDATE salons SET latitude = 51.8833, longitude = 5.2833 WHERE city ILIKE '%tiel%';
UPDATE salons SET latitude = 51.9167, longitude = 5.2833 WHERE city ILIKE '%culemborg%';
UPDATE salons SET latitude = 51.9500, longitude = 5.2833 WHERE city ILIKE '%vianen%';
UPDATE salons SET latitude = 51.9833, longitude = 5.2833 WHERE city ILIKE '%harmelen%';
UPDATE salons SET latitude = 52.0167, longitude = 5.2833 WHERE city ILIKE '%lopik%';
UPDATE salons SET latitude = 52.0500, longitude = 5.2833 WHERE city ILIKE '%ijsselstein%';
UPDATE salons SET latitude = 52.0833, longitude = 5.2833 WHERE city ILIKE '% Nieuwegein%';
UPDATE salons SET latitude = 52.1167, longitude = 5.2833 WHERE city ILIKE '%houten%';
UPDATE salons SET latitude = 52.1500, longitude = 5.2833 WHERE city ILIKE '%wijk bij duurstede%';
UPDATE salons SET latitude = 52.1833, longitude = 5.2833 WHERE city ILIKE '%cothen%';
UPDATE salons SET latitude = 52.2167, longitude = 5.2833 WHERE city ILIKE '%woudenberg%';
UPDATE salons SET latitude = 52.2500, longitude = 5.2833 WHERE city ILIKE '%leersum%';
UPDATE salons SET latitude = 52.2833, longitude = 5.2833 WHERE city ILIKE '%doorn%';
UPDATE salons SET latitude = 52.3167, longitude = 5.2833 WHERE city ILIKE '%maarsbergen%';
UPDATE salons SET latitude = 52.3500, longitude = 5.2833 WHERE city ILIKE '%maarn%';
UPDATE salons SET latitude = 52.3833, longitude = 5.2833 WHERE city ILIKE '%soest%';
UPDATE salons SET latitude = 52.4167, longitude = 5.2833 WHERE city ILIKE '%soesterberg%';
UPDATE salons SET latitude = 52.4500, longitude = 5.2833 WHERE city ILIKE '%zeist%';
UPDATE salons SET latitude = 52.4833, longitude = 5.2833 WHERE city ILIKE '%de bilt%';
UPDATE salons SET latitude = 52.5167, longitude = 5.2833 WHERE city ILIKE '%bilthoven%';
UPDATE salons SET latitude = 52.5500, longitude = 5.2833 WHERE city ILIKE '%baarn%';
UPDATE salons SET latitude = 52.5833, longitude = 5.2833 WHERE city ILIKE '%hilversum%';
UPDATE salons SET latitude = 52.6167, longitude = 5.2833 WHERE city ILIKE '%laren%';
UPDATE salons SET latitude = 52.6500, longitude = 5.2833 WHERE city ILIKE '%bussum%';
UPDATE salons SET latitude = 52.6833, longitude = 5.2833 WHERE city ILIKE '%naarden%';
UPDATE salons SET latitude = 52.7167, longitude = 5.2833 WHERE city ILIKE '%muiden%';
UPDATE salons SET latitude = 52.7500, longitude = 5.2833 WHERE city ILIKE '%weesp%';
UPDATE salons SET latitude = 52.7833, longitude = 5.2833 WHERE city ILIKE '%diemen%';
UPDATE salons SET latitude = 52.8167, longitude = 5.2833 WHERE city ILIKE '%duivendrecht%';
UPDATE salons SET latitude = 52.8500, longitude = 5.2833 WHERE city ILIKE '%amstelveen%';
UPDATE salons SET latitude = 52.8833, longitude = 5.2833 WHERE city ILIKE '%ouderkerk aan de amstel%';
UPDATE salons SET latitude = 52.9167, longitude = 5.2833 WHERE city ILIKE '%abcoude%';
UPDATE salons SET latitude = 52.9500, longitude = 5.2833 WHERE city ILIKE '%breukelen%';
UPDATE salons SET latitude = 52.9833, longitude = 5.2833 WHERE city ILIKE '%loenen aan de vecht%';
UPDATE salons SET latitude = 53.0167, longitude = 5.2833 WHERE city ILIKE '%nigtevecht%';
UPDATE salons SET latitude = 53.0500, longitude = 5.2833 WHERE city ILIKE '%maarssen%';
UPDATE salons SET latitude = 53.0833, longitude = 5.2833 WHERE city ILIKE '%maarsenbroek%';
UPDATE salons SET latitude = 53.1167, longitude = 5.2833 WHERE city ILIKE '%westbroek%';
UPDATE salons SET latitude = 53.1500, longitude = 5.2833 WHERE city ILIKE '%loenersloot%';
UPDATE salons SET latitude = 53.1833, longitude = 5.2833 WHERE city ILIKE '%kockengen%';
UPDATE salons SET latitude = 53.2167, longitude = 5.2833 WHERE city ILIKE '%breukeleveen%';
UPDATE salons SET latitude = 53.2500, longitude = 5.2833 WHERE city ILIKE '%nieuwer ter aa%';
UPDATE salons SET latitude = 53.2833, longitude = 5.2833 WHERE city ILIKE '%vinkeveen%';
UPDATE salons SET latitude = 53.3167, longitude = 5.2833 WHERE city ILIKE '%willemstad%';
UPDATE salons SET latitude = 53.3500, longitude = 5.2833 WHERE city ILIKE '%mijdrecht%';
UPDATE salons SET latitude = 53.3833, longitude = 5.2833 WHERE city ILIKE '%achterveld%';
UPDATE salons SET latitude = 53.4167, longitude = 5.2833 WHERE city ILIKE '%kortenhoef%';
UPDATE salons SET latitude = 53.4500, longitude = 5.2833 WHERE city ILIKE '%an keveensen%';
UPDATE salons SET latitude = 53.4833, longitude = 5.2833 WHERE city ILIKE '%oud loosdrecht%';
UPDATE salons SET latitude = 53.5167, longitude = 5.2833 WHERE city ILIKE '%loenersloot%'; -- duplicate
UPDATE salons SET latitude = 53.5500, longitude = 5.2833 WHERE city ILIKE '%utrechtse heuvelrug%';
UPDATE salons SET latitude = 53.5833, longitude = 5.2833 WHERE city ILIKE '%renswoude%';
UPDATE salons SET latitude = 53.6167, longitude = 5.2833 WHERE city ILIKE '%leersum%'; -- duplicate
UPDATE salons SET latitude = 53.6500, longitude = 5.2833 WHERE city ILIKE '%amerongen%';
UPDATE salons SET latitude = 53.6833, longitude = 5.2833 WHERE city ILIKE '%overberg%';
UPDATE salons SET latitude = 53.7167, longitude = 5.2833 WHERE city ILIKE '%elst%';
UPDATE salons SET latitude = 53.7500, longitude = 5.2833 WHERE city ILIKE '%renswoude%'; -- duplicate
UPDATE salons SET latitude = 53.7833, longitude = 5.2833 WHERE city ILIKE '%woudenberg%'; -- duplicate
UPDATE salons SET latitude = 53.8167, longitude = 5.2833 WHERE city ILIKE '%barneveld%';
UPDATE salons SET latitude = 53.8500, longitude = 5.2833 WHERE city ILIKE '%voorthuizen%';
UPDATE salons SET latitude = 53.8833, longitude = 5.2833 WHERE city ILIKE '%kootwijkerbroek%';
UPDATE salons SET latitude = 53.9167, longitude = 5.2833 WHERE city ILIKE '%garderen%';
UPDATE salons SET latitude = 53.9500, longitude = 5.2833 WHERE city ILIKE '%speuld%';
UPDATE salons SET latitude = 53.9833, longitude = 5.2833 WHERE city ILIKE '%apeldoorn%';
UPDATE salons SET latitude = 52.2112, longitude = 5.9697 WHERE city ILIKE '%apeldoorn%';
UPDATE salons SET latitude = 52.5168, longitude = 6.0830 WHERE city ILIKE '%zwolle%';
UPDATE salons SET latitude = 52.2215, longitude = 6.8937 WHERE city ILIKE '%enschede%';
UPDATE salons SET latitude = 53.2194, longitude = 6.5665 WHERE city ILIKE '%groningen%';
UPDATE salons SET latitude = 53.2012, longitude = 5.7992 WHERE city ILIKE '%leeuwarden%';
UPDATE salons SET latitude = 51.4988, longitude = 3.6136 WHERE city ILIKE '%middelburg%';
UPDATE salons SET latitude = 51.1942, longitude = 5.9875 WHERE city ILIKE '%roermond%';
UPDATE salons SET latitude = 51.3704, longitude = 6.1724 WHERE city ILIKE '%venlo%';
UPDATE salons SET latitude = 52.1428, longitude = 6.1961 WHERE city ILIKE '%zutphen%';
UPDATE salons SET latitude = 52.3508, longitude = 5.2647 WHERE city ILIKE '%almere%';
UPDATE salons SET latitude = 52.3025, longitude = 4.6914 WHERE city ILIKE '%schiphol%';
UPDATE salons SET latitude = 52.0833, longitude = 5.1167 WHERE city ILIKE '%de uithof%';
UPDATE salons SET latitude = 52.0833, longitude = 5.1167 WHERE city ILIKE '%utrecht%'; -- duplicate
UPDATE salons SET latitude = 51.9833, longitude = 5.9167 WHERE city ILIKE '%arnhem%'; -- duplicate
UPDATE salons SET latitude = 51.8167, longitude = 5.8667 WHERE city ILIKE '%nijmegen%'; -- duplicate
UPDATE salons SET latitude = 51.4416, longitude = 5.4697 WHERE city ILIKE '%eindhoven%'; -- duplicate
UPDATE salons SET latitude = 51.5555, longitude = 5.0913 WHERE city ILIKE '%tilburg%'; -- duplicate
UPDATE salons SET latitude = 51.5719, longitude = 4.7683 WHERE city ILIKE '%breda%'; -- duplicate
UPDATE salons SET latitude = 51.6667, longitude = 5.6167 WHERE city ILIKE '%uden%'; -- duplicate
UPDATE salons SET latitude = 52.2112, longitude = 5.9697 WHERE city ILIKE '%apeldoorn%'; -- duplicate
UPDATE salons SET latitude = 52.5168, longitude = 6.0830 WHERE city ILIKE '%zwolle%'; -- duplicate
UPDATE salons SET latitude = 52.2215, longitude = 6.8937 WHERE city ILIKE '%enschede%'; -- duplicate
UPDATE salons SET latitude = 53.2194, longitude = 6.5665 WHERE city ILIKE '%groningen%'; -- duplicate
UPDATE salons SET latitude = 53.2012, longitude = 5.7992 WHERE city ILIKE '%leeuwarden%'; -- duplicate
UPDATE salons SET latitude = 51.4988, longitude = 3.6136 WHERE city ILIKE '%middelburg%'; -- duplicate
UPDATE salons SET latitude = 51.1942, longitude = 5.9875 WHERE city ILIKE '%roermond%'; -- duplicate
UPDATE salons SET latitude = 51.3704, longitude = 6.1724 WHERE city ILIKE '%venlo%'; -- duplicate
UPDATE salons SET latitude = 52.1428, longitude = 6.1961 WHERE city ILIKE '%zutphen%'; -- duplicate
UPDATE salons SET latitude = 52.3508, longitude = 5.2647 WHERE city ILIKE '%almere%'; -- duplicate
UPDATE salons SET latitude = 52.3025, longitude = 4.6914 WHERE city ILIKE '%schiphol%'; -- duplicate
UPDATE salons SET latitude = 52.0833, longitude = 5.1167 WHERE city ILIKE '%de uithof%'; -- duplicate

-- Default for others (central Netherlands, e.g., Utrecht area)
UPDATE salons SET latitude = 52.0907, longitude = 5.1214 WHERE latitude IS NULL;
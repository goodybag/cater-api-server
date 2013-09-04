CREATE OR REPLACE FUNCTION json_cmp(
    json,
    json
) RETURNS INTEGER LANGUAGE SQL STRICT IMMUTABLE AS $$
    SELECT bttextcmp($1::text, $2::text);
$$;

CREATE OR REPLACE FUNCTION json_eq(
    json,
    json
) RETURNS BOOLEAN LANGUAGE SQL STRICT IMMUTABLE AS $$
    SELECT bttextcmp($1::text, $2::text) = 0;
$$;


CREATE OR REPLACE FUNCTION json_lt(
    json,
    json
) RETURNS BOOLEAN LANGUAGE SQL STRICT IMMUTABLE AS $$
    SELECT bttextcmp($1::text, $2::text) < 0;
$$;


CREATE OR REPLACE FUNCTION json_gt(
    json,
    json
) RETURNS BOOLEAN LANGUAGE SQL STRICT IMMUTABLE AS $$
    SELECT bttextcmp($1::text, $2::text) > 0;
$$;

CREATE OR REPLACE FUNCTION json_lte(
    json,
    json
) RETURNS BOOLEAN LANGUAGE SQL STRICT IMMUTABLE AS $$
    SELECT bttextcmp($1::text, $2::text) <= 0;
$$;

CREATE OR REPLACE FUNCTION json_gte(
    json,
    json
) RETURNS BOOLEAN LANGUAGE SQL STRICT IMMUTABLE AS $$
    SELECT bttextcmp($1::text, $2::text) >= 0;
$$;


CREATE OPERATOR = (
    LEFTARG   = json,
    RIGHTARG  = json,
    PROCEDURE = json_eq
);

CREATE OPERATOR < (
    LEFTARG   = json,
    RIGHTARG  = json,
    PROCEDURE = json_lt
);

CREATE OPERATOR > (
    LEFTARG   = json,
    RIGHTARG  = json,
    PROCEDURE = json_gt
);

CREATE OPERATOR <= (
    LEFTARG   = json,
    RIGHTARG  = json,
    PROCEDURE = json_lte
);

CREATE OPERATOR >= (
    LEFTARG   = json,
    RIGHTARG  = json,
    PROCEDURE = json_gte
);


CREATE OPERATOR CLASS json_ops
DEFAULT FOR TYPE JSON USING btree AS
OPERATOR    1   <   (json, json),
OPERATOR    2   <=   (json, json),
OPERATOR    3   =  (json, json),
OPERATOR    4   >=   (json, json),
OPERATOR    5   >   (json, json),
FUNCTION    1   json_cmp(json, json);
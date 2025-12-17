-- Back-End/src/schema.sql
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `kakao_id` BIGINT NULL,

    `nickname` VARCHAR(255),
    `profile_img` VARCHAR(255),

    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),

    UNIQUE KEY `uk_user_kakao_id` (`kakao_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ddu_beok` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(255),
    `location` VARCHAR(255),
    `password` VARCHAR(255),
    `start_date` DATETIME,
    `end_date` DATETIME,
    `img` VARCHAR(255),
    `participant` VARCHAR(255),
    `latitude` DOUBLE,
    `longitude` DOUBLE,
    `is_favorite` TINYINT(1) DEFAULT 0,

    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_ddu_beok_user_id` (`user_id`),
    CONSTRAINT `fk_ddu_beok_user`
      FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `schedule` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `ddu_beok_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,

    -- ✅ 프론트 item.title 저장용
    `title` VARCHAR(255),

    -- ✅ blocks(JSON 문자열)를 저장하므로 LONGTEXT 권장
    `content` LONGTEXT,

    `start_time` TIME,
    `end_time` TIME,
    `loc_detail` VARCHAR(255),
    `latitude` DOUBLE,
    `longitude` DOUBLE,
    `day_num` INT,

    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_schedule_ddu_beok_id` (`ddu_beok_id`),
    KEY `idx_schedule_user_id` (`user_id`),

    CONSTRAINT `fk_schedule_ddu_beok`
      FOREIGN KEY (`ddu_beok_id`) REFERENCES `ddu_beok`(`id`),
    CONSTRAINT `fk_schedule_user`
      FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `todo` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `ddu_beok_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `category` VARCHAR(255),
    `content` VARCHAR(255),
    `is_checked` TINYINT(1) DEFAULT 0,
    `day_num` INT,

    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_todo_ddu_beok_id` (`ddu_beok_id`),
    KEY `idx_todo_user_id` (`user_id`),

    CONSTRAINT `fk_todo_ddu_beok`
      FOREIGN KEY (`ddu_beok_id`) REFERENCES `ddu_beok`(`id`),
    CONSTRAINT `fk_todo_user`
      FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `recommend` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255),
    `img` VARCHAR(255),

    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
